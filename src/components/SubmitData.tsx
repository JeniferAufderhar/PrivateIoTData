import { useState } from 'react';
import { useContractWrite } from '@/hooks/useContractWrite';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';

const DATA_TYPES = [
  { value: 0, label: 'Temperature', unit: '°C' },
  { value: 1, label: 'Humidity', unit: '%' },
  { value: 2, label: 'Pressure', unit: 'hPa' },
  { value: 3, label: 'Motion', unit: 'events' },
  { value: 4, label: 'Light', unit: 'lux' },
  { value: 5, label: 'Sound', unit: 'dB' },
];

export function SubmitData() {
  const [deviceId, setDeviceId] = useState('');
  const [deviceIndex, setDeviceIndex] = useState<number | null>(null);
  const [dataValue, setDataValue] = useState('');
  const [dataType, setDataType] = useState(0);
  const { execute, isLoading } = useContractWrite();

  const { data: deviceInfo } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getDeviceByString',
    args: deviceId ? [deviceId] : undefined,
    query: {
      enabled: !!deviceId,
    },
  });

  const handleCheckDevice = () => {
    if (deviceInfo && Array.isArray(deviceInfo)) {
      const [index, exists] = deviceInfo;
      if (exists) {
        setDeviceIndex(Number(index));
        toast({
          title: 'Device Found',
          description: `Device found at index ${index}`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Device Not Found',
          description: 'This device is not registered',
        });
      }
    }
  };

  const handleSubmit = async () => {
    if (deviceIndex === null) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please verify device first',
      });
      return;
    }

    if (!dataValue) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please enter a data value',
      });
      return;
    }

    try {
      const value = Math.floor(Number(dataValue));

      await execute(
        'submitData',
        [BigInt(deviceIndex), value, dataType],
        'Data submitted successfully',
        'Failed to submit data'
      );

      toast({
        title: 'Success',
        description: `Data submitted successfully for ${DATA_TYPES[dataType].label}!`,
      });

      setDataValue('');
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Device Data</CardTitle>
        <CardDescription>
          Record encrypted sensor data from your IoT devices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="submitDeviceId">Device ID</Label>
          <div className="flex gap-2">
            <Input
              id="submitDeviceId"
              placeholder="Enter device ID"
              value={deviceId}
              onChange={(e) => {
                setDeviceId(e.target.value);
                setDeviceIndex(null);
              }}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleCheckDevice}
              variant="outline"
              disabled={!deviceId || isLoading}
            >
              Verify
            </Button>
          </div>
          {deviceIndex !== null && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <AlertCircle className="h-4 w-4" />
              Device verified (Index: {deviceIndex})
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="dataValue">Data Value</Label>
          <Input
            id="dataValue"
            type="number"
            step="0.01"
            placeholder={`Enter ${DATA_TYPES[dataType].label.toLowerCase()} value`}
            value={dataValue}
            onChange={(e) => setDataValue(e.target.value)}
            disabled={isLoading || deviceIndex === null}
          />
          <p className="text-xs text-muted-foreground">
            Unit: {DATA_TYPES[dataType].unit}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dataType">Data Type</Label>
          <select
            id="dataType"
            value={dataType}
            onChange={(e) => setDataType(Number(e.target.value))}
            disabled={isLoading || deviceIndex === null}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {DATA_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label} ({type.unit})
              </option>
            ))}
          </select>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isLoading || deviceIndex === null}
          className="w-full"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Submitting...' : 'Submit Data'}
        </Button>
      </CardContent>
    </Card>
  );
}
