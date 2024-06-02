// TODO: SignMessage
import { verify } from '@noble/ed25519';
import { useWallet, useConnection, WalletContextState } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { FC, useCallback, useEffect, useState } from 'react';
import { notify } from "../utils/notifications";

import { Program, AnchorProvider, web3, utils, BN, setProvider } from "@coral-xyz/anchor"
import idl from "./crowdfunding_app.json"
import { CrowdfundingApp } from "./crowdfunding_app"
import { PublicKey } from '@solana/web3.js';
// import { useProvider } from 'hooks/getProvider';

const idl_string = JSON.stringify(idl)
const idl_object = JSON.parse(idl_string)
const programID = new PublicKey(idl.address)

export const Campaigns: FC = () => {
    const ourWallet = useWallet();
    const { connection } = useConnection()
    const [campaigns, setCampaigns] = useState([])

    const getProvider = (connection: web3.Connection, ourWallet : WalletContextState) => {
        const provider = new AnchorProvider(connection, ourWallet, AnchorProvider.defaultOptions())
        setProvider(provider)
        return provider
    }

    const getCampaigns = async () => {
        try {
            const anchProvider = getProvider(connection, ourWallet)
            const program = new Program<CrowdfundingApp>(idl_object, anchProvider)
            Promise.all((await connection.getParsedProgramAccounts(programID)).map(async campaigns => ({
                ...(await program.account.campaign.fetch(campaigns.pubkey)),
                pubkey: campaigns.pubkey
            }))).then(campaigns => {
                console.log(campaigns)
                setCampaigns(campaigns)
            })


        } catch (error) {
            console.error("Error while getting campaigns: " + error)
        }
    }

    const donate = async (publicKey) => {
        try {
            const anchProvider = getProvider(connection, ourWallet)
            const program = new Program<CrowdfundingApp>(idl_object, anchProvider)

            await program.methods.donate(new BN(0.2 * web3.LAMPORTS_PER_SOL))
                .accounts({
                    campaign: publicKey,
                    user: anchProvider?.publicKey?.toString(),
                    // systemProgram: SystemProgram.programId
                }).rpc()

            console.log(" Deposit done: " + publicKey)

            notify({ type: "success", message: "Donation successful", description: "Donated 0.2 SOL to the campaign", txid: publicKey })

            getCampaigns()

        } catch (error) {
            console.error("Error while depositing to a bank: " + error)
        }
    }

    const withdraw = async (publicKey) => {
        try {
            const anchProvider = getProvider(connection, ourWallet)
            const program = new Program<CrowdfundingApp>(idl_object, anchProvider)

            await program.methods.withdraw(new BN(0.2 * web3.LAMPORTS_PER_SOL))
                .accounts({
                    campaign: publicKey,
                    user: anchProvider.publicKey
                }).rpc()

            console.log(" Deposit done: " + publicKey)

            notify({ type: "success", message: "Withdraw successful", description: "Withdrew 0.2 SOL from the campaign", txid: publicKey })

            getCampaigns()

        } catch (error) {
            console.error("Error while depositing to a bank: " + error)
        }
    }

    useEffect(() => { getCampaigns() }, [])

    return (
        <div className='w-screen'>
            <div className='flex flex-col h-[30rem] gap-y-11 overflow-y-scroll items-center scroll-p-0'>
                {
                    campaigns ? campaigns.map((campaign, index) => {
                        return (
                            <div key={index} id={`campaign${index}`} className='md:hero-content flex flex-col min-h-[18rem] w-[20rem] card bg-violet-700 shadow-xl'>
                                <h1>{new TextDecoder().decode(new Uint8Array(campaign.name.filter(i => i))).toString()}</h1>
                                <span>{(campaign.totalFunding / web3.LAMPORTS_PER_SOL).toString()} SOL out of {campaign.fundingGoal.toString()}</span>
                                <button
                                    className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                                    onClick={() => donate(campaign.pubkey.toString())}>
                                    <span>
                                        Donate 0.2 SOL
                                    </span>
                                </button>
                                <button
                                    className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                                    onClick={() => withdraw(campaign.pubkey.toString())}>
                                    <span>
                                        Withdraw 0.2 SOL
                                    </span>
                                </button>
                            </div>
                        )
                    })
                        :
                        <div className="flex flex-row justify-center mt-[5rem]">
                           Create a campaign!
                        </div>
                }
            </div>
        </div>
    );
};