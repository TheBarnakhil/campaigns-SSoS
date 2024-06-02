import { AnchorProvider, setProvider, web3 } from "@coral-xyz/anchor"
import { WalletContextState } from "@solana/wallet-adapter-react"

export const useProvider = (connection: web3.Connection, ourWallet : WalletContextState) => {
    const provider = new AnchorProvider(connection, ourWallet, AnchorProvider.defaultOptions())
    setProvider(provider)
    return provider
}