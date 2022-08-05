import { useState } from "react";
import { ethers } from "ethers";
import {create as ipfsHttpClient} from 'ipfs-http-client';
import {useRouter} from 'next/router';
import Web3Modal from 'web3modal';

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

import {
    nftaddress, nftmarketaddress
} from '../config'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'
import { EventFragment } from "ethers/lib/utils";




export default function CreateItem() {
    const [fileUrl, setFileUrl] = useState(null);
    const [formInput, updateFormInput] = useState({price: '', name:'', description:'',warranty:'',uniqueid:''})
    const router = useRouter()

    async function onChange(e) {
        const file = e.target.files[0]
        try {
            const added = await client.add(
                file,
                {
                    progress: (prog) => console.log(`received: ${prog}`)
                }
            )
            const url = `https://ipfs.infura.io/ipfs/${added.path}`
            setFileUrl(url)
        } catch(e) {
            console.log(e)
        }
    }

    async function createItem() {
        const {name, description, price, warranty,uniqueid} = formInput
        if(!name || !description || !price || !fileUrl || !warranty || !uniqueid) return

        const data = JSON.stringify({
            name,description,image: fileUrl
        })

        try {
            const added = await client.add(data)
            const url = `https://ipfs.infura.io/ipfs/${added.path}`

            createSale(url)
        } catch(error){
            console.log('Error uploading file: ', error)
        }
    }

    async function createSale(url) {
        const web3Modal = new Web3Modal()
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()

        let contract = new ethers.Contract(nftaddress, NFT.abi, signer)
        let transaction = await contract.createToken(url)
        let tx = await transaction.wait()
        
        let event = tx.events[0]
        let value = event.args[2]
        let tokenId = value.toNumber()

        const price = ethers.utils.parseUnits(formInput.price, 'ether')
        const warranty = parseInt(formInput.warranty)
        console.log("warranty", warranty)
        const uniqueId = parseInt(formInput.uniqueid)
        contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
        
        let listingPrice = await contract.getListingPrice()
        listingPrice = listingPrice.toString()

        transaction = await contract.createMarketItem(nftaddress, tokenId, uniqueId, price, warranty, { value: listingPrice})
        await transaction.wait()
        router.push('/')

    }

    return (
        <div className="flex justify-center" >
            <div className = "w-1/2 flex flex-col pb-12">
                <input 
                    placeholder="Item Name"
                    className="mt-8 border rounded p-4"
                    onChange={e => updateFormInput({...formInput, name: e.target.value})}
                />
                <input 
                    placeholder="Serial ID (completely unique)"
                    className="mt-8 border rounded p-4"
                    onChange={e => updateFormInput({...formInput, uniqueid: e.target.value})}
                />
                <textarea 
                    placeholder="Item Description"
                    className="mt-8 border rounded p-4"
                    onChange={e => updateFormInput({...formInput, description: e.target.value})}
                />
                <input 
                    placeholder="Item Cost in Rupees"
                    className="mt-2 border rounded p-4"
                    onChange={e => updateFormInput({...formInput, price: e.target.value})}
                />
                <input 
                    placeholder="Enter warranty of the product"
                    className="mt-8 border rounded p-4"
                    onChange={e => updateFormInput({...formInput, warranty: e.target.value})}

                />
                <input 
                    type="file"
                    name = "Asset"
                    className="my-4"
                    onChange={onChange}
                />
                {
                    fileUrl && (
                        <img className='rounded mt-4' width = "350" src={fileUrl} />
                    )
                }
                <button onClick={createItem} className="font-bold mt-4 bg-blue-500 text-white rounded p-4 shadow-lg">
                    Add Item For Sale
                </button>
            </div>
        </div>
    )

}