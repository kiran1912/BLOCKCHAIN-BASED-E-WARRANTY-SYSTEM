import { useEffect, useState } from "react";
import { ethers } from "ethers";
import Web3Modal from 'web3modal'
import axios from 'axios'


import {
    nftaddress, nftmarketaddress
} from '../config'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'

export default function MyAssets() {
    const [nfts, setNfts] = useState([])
    const [loadingState, setLoadingState] = useState('not-loaded')

    useEffect( () => {
        loadNfts()
    }, [])

    async function loadNfts () {
        const web3Modal = new Web3Modal()
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()

        const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
        const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
        const data = await marketContract.fetchMyNFTs()

        const items = await Promise.all(data.map(async i => {
            const tokenUri = await tokenContract.tokenURI(i.tokenId)
            const meta = await axios.get(tokenUri)
            let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
            let item = {
                price,
                uniqueId: i.uniqueId.toString(),
                tokenId: i.tokenId.toNumber(),
                seller: i.seller,
                owner: i.owner,
                image: meta.data.image,
                warranty: i.warrantyPeriod.toString(),
                name: meta.data.name,
                description: meta.data.description
            }

            return item
        }))

        setNfts(items)
        setLoadingState('loaded')
    }
    if(loadingState === 'loaded' && !nfts.length) return (
        <h1 className="py-10 px-20 text-3xl">No Assets owned</h1>
    )

    return (
        <div className="flex">
            <div>
                {
                    nfts.map( (nft,i) => (
                        
                        <div className=" h-screen bg-blue-lightest" key={i}>
                        <div id="app" className="bg-white w-128 h-60 rounded shadow-md flex card text-grey-darkest">
                        
                        <img className="w-1/2 h-full rounded-l-sm" src={nft.image} alt="Room Image" />
                        
                        <div className="w-full flex flex-col">
                                <div className="p-4 pb-0 flex-1">
                                    <h3 className="font-semibold mb-1 text-black"><b>ITEM NAME</b>: {nft.name}</h3>
                                    
                                    <div className="text-xm flex items-center mb-4 font-semibold">
                                        <i className="fas fa-map-marker-alt mr-1 text-grey-dark "></i>
                                        <b>Description: </b>
                                        {nft.description}
                                        {console.log(nft)}
                                    </div>
                                    <div >
                                        <p className='text-0.7xl font-semibold ml-4 '>uniqueId: {nft.uniqueId}</p>
                                    </div>
                                    <span className="text-5xl text-grey-darkest">₹{nft.price}<span className="text-lg"></span></span>

                                </div>
                                <div className="bg-grey-lighter p-3 flex items-center justify-between transition hover:bg-grey-light">
                                    Warranty left: {nft.warranty} year
                                    <i className="fas fa-chevron-right"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    ))
                }
            </div>
        </div>
    )

}



