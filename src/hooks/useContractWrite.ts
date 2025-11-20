import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/wagmi';
import { toast } from '@/components/ui/use-toast';

export const useContractWrite = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { writeContractAsync, data: hash } = useWriteContract();
  const { isSuccess, isError } = useWaitForTransactionReceipt({ hash });

  const execute = async (
    functionName: string,
    args: any[],
    successMessage: string,
    errorMessage: string
  ) => {
    setIsLoading(true);
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName,
        args,
      });

      toast({
        title: 'Transaction Submitted',
        description: 'Waiting for confirmation...',
      });

      return hash;
    } catch (error: any) {
      console.error(`${errorMessage}:`, error);
      toast({
        variant: 'destructive',
        title: 'Transaction Failed',
        description: error?.message || errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    execute,
    isLoading,
    isSuccess,
    isError,
    hash,
  };
};
