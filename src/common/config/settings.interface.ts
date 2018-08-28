export interface ISettings {
        // Applications
        IP:string
        Port: number,
    
        // Lightning Memory-Mapped Database
        LMDBPath: string;
        MDBPath: string;
        DatabaseSize: number;
        MaxDbs: number;
    
        // Process PID
        DaemonPidFilePath: string;
    
        // Identity/Cryptography
        Identity: string;
        PrivateExtendedKeyPath: string;
        ChildDerivationIndex: number;
    
        // Database
        EmbeddedDatabaseDirectory: string;
        EmbeddedPeerCachePath: string;
        EmbeddedWalletDirectory: string;
    
        // Node Options
        NodePublicPort: number;
        NodeListenPort: number;
        NodePublicAddress: string;
        NodeListenAddress: string;
    
        // Onion Plugin
        OnionEnabled: number;
        OnionVirtualPort: number;
        OnionHiddenServiceDirectory: string;
        OnionLoggingVerbosity: string;
        OnionLoggingEnabled: number;
    
        // Bandwidth Metering
        BandwidthAccountingEnabled: number;
        BandwidthAccountingMax: string;
        BandwidthAccountingReset: string;
    
        // NAT Traversal
        TraverseNatEnabled: number;
        TraversePortForwardTTL: number;
        TraverseReverseTunnelHostname: string;
        TraverseReverseTunnelPort: number;
    
        // SSL Certificate
        SSLCertificatePath: string;
        SSLKeyPath: string;
        SSLAuthorityPaths: Array<string>;
    
        // Network Bootstrapping
        NetworkBootstrapNodes: Array<any>;
    
        // Debugging/Developer
        VerboseLoggingEnabled: number;
        LogFilePath: string;
        LogFileMaxBackCopies: number;
        TanLogFilePath: string;
    
        // Local Control Protocol
        ControlPortEnabled: number;
        ControlPort: number;
        ControlSockEnabled: number;
        ControlSock: string;
    
        // Enables the Test Mode (lowers difficulty)
        TestNetworkEnabled: number;

        // Tor.real pid
        TorPID: number;

        //Onion address
        OnionAddress: string;

        // Hashicorp Vault
        ApiVersion: string;
        Endpoint: string;
        Token: string;
}