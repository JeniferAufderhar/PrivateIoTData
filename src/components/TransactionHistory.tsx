import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw, Calendar, User } from 'lucide-react';

const DATA_TYPE_LABELS = ['Temperature', 'Humidity', 'Pressure', 'Motion', 'Light', 'Sound'];

interface DataRecord {
  deviceIndex: bigint;
  dataType: number;
  timestamp: bigint;
  submitter: string;
  recordId: number;
}

export function TransactionHistory() {
  const [deviceId, setDeviceId] = useState('');
  const [deviceIndex, setDeviceIndex] = useState<number | null>(null);
  const [records, setRecords] = useState<DataRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  const { data: deviceInfo } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getDeviceByString',
    args: deviceId ? [deviceId] : undefined,
    query: {
      enabled: !!deviceId,
    },
  });

  const { data: totalRecords, refetch: refetchTotal } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'dataRecordCount',
  });

  const { data: deviceDataCount } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getDeviceDataCount',
    args: deviceIndex !== null ? [BigInt(deviceIndex)] : undefined,
    query: {
      enabled: deviceIndex !== null,
    },
  });

  const loadRecords = async () => {
    if (!deviceId.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please enter a device ID',
      });
      return;
    }

    if (!deviceInfo || !Array.isArray(deviceInfo)) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please verify the device exists',
      });
      return;
    }

    const [index, exists] = deviceInfo;
    if (!exists) {
      toast({
        variant: 'destructive',
        title: 'Device Not Found',
        description: 'This device is not registered',
      });
      return;
    }

    setDeviceIndex(Number(index));
    setIsLoadingRecords(true);

    try {
      await refetchTotal();
      const total = Number(totalRecords || 0);
      const fetchedRecords: DataRecord[] = [];

      for (let i = 0; i < total; i++) {
        try {
          const response = await fetch(`/api/record/${i}`);
          if (response.ok) {
            const data = await response.json();
            if (Number(data.deviceIndex) === Number(index)) {
              fetchedRecords.push({
                ...data,
                recordId: i,
              });
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch record ${i}:`, error);
        }
      }

      setRecords(fetchedRecords);

      if (fetchedRecords.length === 0) {
        toast({
          title: 'No Records',
          description: 'No data records found for this device',
        });
      } else {
        toast({
          title: 'Records Loaded',
          description: `Found ${fetchedRecords.length} records`,
        });
      }
    } catch (error) {
      console.error('Error loading records:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load records',
      });
    } finally {
      setIsLoadingRecords(false);
    }
  };

  const formatTimestamp = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>
          View all data submissions for your IoT devices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Total Data Records in System: <strong>{totalRecords?.toString() || '0'}</strong>
          </p>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="searchDeviceId">Device ID</Label>
            <Input
              id="searchDeviceId"
              placeholder="Enter device ID to filter"
              value={deviceId}
              onChange={(e) => {
                setDeviceId(e.target.value);
                setDeviceIndex(null);
                setRecords([]);
              }}
              disabled={isLoadingRecords}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={loadRecords} disabled={isLoadingRecords || !deviceId}>
              {isLoadingRecords ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Load</span>
            </Button>
          </div>
        </div>

        {deviceDataCount !== undefined && deviceIndex !== null && (
          <div className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-800 rounded-md p-3">
            Device Records: <strong>{deviceDataCount.toString()}</strong>
          </div>
        )}

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {records.length === 0 && !isLoadingRecords && deviceIndex !== null && (
            <div className="text-center py-12 text-muted-foreground">
              <div className="mb-2 text-4xl">📊</div>
              <p className="font-medium">No records found for this device</p>
              <p className="text-sm">Submit some data to see it appear here</p>
            </div>
          )}

          {isLoadingRecords && (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Loading records...</p>
            </div>
          )}

          {records.map((record) => (
            <div
              key={record.recordId}
              className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-lg">
                    {DATA_TYPE_LABELS[record.dataType]}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Record #{record.recordId}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatTimestamp(record.timestamp)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Submitted by:</span>
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {formatAddress(record.submitter)}
                </code>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
