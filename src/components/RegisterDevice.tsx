import { useState } from 'react';
import { useContractWrite } from '@/hooks/useContractWrite';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export function RegisterDevice() {
  const [deviceId, setDeviceId] = useState('');
  const { execute, isLoading } = useContractWrite();

  const { data: totalDevices, refetch } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'deviceCount',
  });

  const handleRegister = async () => {
    if (!deviceId.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please enter a device ID',
      });
      return;
    }

    try {
      await execute(
        'registerDevice',
        [deviceId],
        'Device registered successfully',
        'Failed to register device'
      );

      toast({
        title: 'Success',
        description: `Device "${deviceId}" registered successfully!`,
      });

      setDeviceId('');
      refetch();
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register New Device</CardTitle>
        <CardDescription>
          Add a new IoT device to your secure data management system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Total Registered Devices: <strong>{totalDevices?.toString() || '0'}</strong>
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="deviceId">Device ID</Label>
          <Input
            id="deviceId"
            placeholder="Enter unique device identifier (e.g., sensor-001)"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Choose a unique identifier for your IoT device
          </p>
        </div>
        <Button
          onClick={handleRegister}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Registering...' : 'Register Device'}
        </Button>
      </CardContent>
    </Card>
  );
}
