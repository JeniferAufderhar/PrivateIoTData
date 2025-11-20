import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeviceStats } from '@/components/DeviceStats';
import { RegisterDevice } from '@/components/RegisterDevice';
import { SubmitData } from '@/components/SubmitData';
import { SetThreshold } from '@/components/SetThreshold';
import { TransactionHistory } from '@/components/TransactionHistory';
import { Shield, Database } from 'lucide-react';

function App() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-3 rounded-lg">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Private IoT Data Platform
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Secure device data management with privacy protection
                </p>
              </div>
            </div>
            <ConnectButton />
          </div>
        </header>

        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 max-w-md text-center">
              <Database className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                Connect Your Wallet
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Please connect your wallet to access the Private IoT Data Management Platform.
                Your data will be encrypted and securely stored on the blockchain.
              </p>
              <ConnectButton />
            </div>
          </div>
        ) : (
          <main className="space-y-6">
            <DeviceStats />

            <Tabs defaultValue="register" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="register">Register Device</TabsTrigger>
                <TabsTrigger value="submit">Submit Data</TabsTrigger>
                <TabsTrigger value="threshold">Set Threshold</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="register" className="mt-6">
                <RegisterDevice />
              </TabsContent>

              <TabsContent value="submit" className="mt-6">
                <SubmitData />
              </TabsContent>

              <TabsContent value="threshold" className="mt-6">
                <SetThreshold />
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                <TransactionHistory />
              </TabsContent>
            </Tabs>
          </main>
        )}

        <footer className="mt-12 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Secure IoT Data Management Platform - Privacy Protected</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
