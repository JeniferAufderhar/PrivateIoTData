// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ReentrancyGuard
 * @dev Contract module that helps prevent reentrant calls to a function.
 */
abstract contract ReentrancyGuard {
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    modifier nonReentrant() {
        _beforeNonReentrant();
        _;
        _afterNonReentrant();
    }

    function _beforeNonReentrant() private {
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }
        _status = ENTERED;
    }

    function _afterNonReentrant() private {
        _status = NOT_ENTERED;
    }

    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}

/**
 * @title RateLimiter
 * @dev Contract module for implementing rate limiting to prevent DoS attacks.
 */
abstract contract RateLimiter {
    struct RateLimit {
        uint256 count;
        uint256 lastReset;
        uint256 limit;
        uint256 window;
    }

    mapping(address => mapping(bytes4 => RateLimit)) private _rateLimits;

    error RateLimitExceeded(address user, bytes4 selector, uint256 resetTime);

    event RateLimitConfigured(bytes4 indexed selector, uint256 limit, uint256 window);

    function _configureRateLimit(bytes4 selector, uint256 limit, uint256 window) internal {
        require(limit > 0, "Rate limit must be greater than 0");
        require(window > 0, "Time window must be greater than 0");

        RateLimit storage rateLimit = _rateLimits[msg.sender][selector];
        rateLimit.limit = limit;
        rateLimit.window = window;

        emit RateLimitConfigured(selector, limit, window);
    }

    modifier rateLimited(uint256 maxCalls, uint256 timeWindow) {
        bytes4 selector = msg.sig;
        RateLimit storage rateLimit = _rateLimits[msg.sender][selector];

        if (rateLimit.limit == 0) {
            rateLimit.limit = maxCalls;
            rateLimit.window = timeWindow;
        }

        if (block.timestamp >= rateLimit.lastReset + rateLimit.window) {
            rateLimit.count = 0;
            rateLimit.lastReset = block.timestamp;
        }

        if (rateLimit.count >= rateLimit.limit) {
            revert RateLimitExceeded(
                msg.sender,
                selector,
                rateLimit.lastReset + rateLimit.window
            );
        }

        rateLimit.count++;
        _;
    }

    function getRateLimitStatus(address user, bytes4 selector)
        external
        view
        returns (uint256 count, uint256 limit, uint256 resetTime)
    {
        RateLimit storage rateLimit = _rateLimits[user][selector];
        return (
            rateLimit.count,
            rateLimit.limit,
            rateLimit.lastReset + rateLimit.window
        );
    }
}

/**
 * @title GasLimiter
 * @dev Contract module for gas optimization and preventing gas-based DoS attacks.
 */
abstract contract GasLimiter {
    uint256 private constant MAX_ARRAY_LENGTH = 100;
    uint256 private constant MAX_LOOP_ITERATIONS = 50;

    error ArrayTooLarge(uint256 length, uint256 maxLength);
    error TooManyIterations(uint256 iterations, uint256 maxIterations);

    modifier limitArraySize(uint256 arrayLength) {
        if (arrayLength > MAX_ARRAY_LENGTH) {
            revert ArrayTooLarge(arrayLength, MAX_ARRAY_LENGTH);
        }
        _;
    }

    modifier limitIterations(uint256 iterations) {
        if (iterations > MAX_LOOP_ITERATIONS) {
            revert TooManyIterations(iterations, MAX_LOOP_ITERATIONS);
        }
        _;
    }

    function _validateGasLimit(uint256 requiredGas) internal view {
        require(gasleft() >= requiredGas, "Insufficient gas for operation");
    }
}
