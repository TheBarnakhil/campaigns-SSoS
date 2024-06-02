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
import { useProvider } from 'hooks/getProvider';
import { Campaigns } from './Campaigns';

const idl_string = JSON.stringify(idl)
const idl_object = JSON.parse(idl_string)
const programID = new PublicKey(idl.address)

export const CreateCampaign: FC = () => {
    const ourWallet = useWallet();
    const { connection } = useConnection()

    const [campaign, setCampaign] = useState({
        name: "",
        description: "",
        amount: 0
    })

    const getProvider = (connection: web3.Connection, ourWallet : WalletContextState) => {
        const provider = new AnchorProvider(connection, ourWallet, AnchorProvider.defaultOptions())
        setProvider(provider)
        return provider
    }

    const createCampaign = async (campaign) => {
        try {
            const anchProvider = getProvider(connection, ourWallet)
            const program = new Program<CrowdfundingApp>(idl_object, anchProvider)

            await program.methods.initialize(campaign.name, campaign.description, new BN(campaign.amount)).accounts({
                user: anchProvider.publicKey
            }).rpc()

            console.log("Wow, new campaign was created")

            notify({type: "success", message: "Campaign created successfully"})

        } catch (error) {
            console.error("Error while creating a campaign: " + error)
            notify({type: "error", message: "Error while creating a campaign"})
        }
    }

    const handleSubmit = () => {
        createCampaign(campaign)
    }



    return (
        <div className='w-screen'>
                <div className='flex flex-col gap-y-1 overflow-y-scroll items-center scroll-p-0'>
                    <label className="form-control w-full max-w-xs">
                        <div className="label">
                            <span className="label-text">What is the name of your campaign?</span>
                        </div>
                        <input type="text" placeholder="Type here" className="input input-bordered w-full max-w-xs" onChange={e => setCampaign({
                            ...campaign,
                            name: e.target.value
                        })}/>
                    </label>
                    <label className="form-control w-full max-w-xs">
                        <div className="label">
                            <span className="label-text">Describe your campaign!</span>
                        </div>
                        <input type="text" placeholder="Type here" className="input input-bordered w-full max-w-xs" onChange={e => setCampaign({
                            ...campaign,
                            description: e.target.value
                        })}/>
                    </label>
                    <label className="form-control w-full max-w-xs">
                        <div className="label">
                            <span className="label-text">What is the amount you want to raise?</span>
                        </div>
                        <input type={"number"} placeholder="Type here" className="input input-bordered w-full max-w-xs" onChange={e => setCampaign({
                            ...campaign,
                            amount: parseInt(e.target.value)
                        })}/>
                    </label>
                    <button
                        className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                        onClick={handleSubmit}
                    >Create!</button>
                </div>
        </div>
    );
};