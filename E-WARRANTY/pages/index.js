import styles from '../styles/Home.module.css'   
import { ethers } from 'ethers'
import { useEffect,useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"

import { nftaddress, nftmarketaddress } from '../config.js'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'


export default function Home() {

  const [nfts, setNfts] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')

  useEffect(() => {
    loadNFTs()
  }, [])

  async function loadNFTs() {
    const provider = new ethers.providers.JsonRpcProvider()
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider)
    const data = await marketContract.fetchMarketItems()

    const items = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        warranty: i.warrantyPeriod.toString(),
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
      }

      return item

    }))

    setNfts(items)
    setLoadingState('loaded')
  }

  async function buyNft(nft) {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)

    const signer = provider.getSigner()
    const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)

    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether')

    const transaction = await contract.createMarketSale(nftaddress, nft.tokenId, {
      value: price
    })

    await transaction.wait()
    loadNFTs()
  }


  if(loadingState === 'loaded' && !nfts.length) return(
    <h1 className='px-20 py-10 text-3xl'>No Items Found</h1>
  )


  return (
    <div className="flex justify-center">
      <div className='px-40' style={{ maxWidth: '1600px'}}>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4'>
          {
            nfts.map((nft, i) => (
              <div key={i} className='border shadow rounded-xl overflow-hidden'>
                <img src={nft.image} />
                <div style={{ height: '70px', overflow: 'hidden'}}>
                    <p className='flex justify-center text-gray-900 font-bold text-2xl'>{nft.name}</p>
                    <p  className='flex text-gray-700 font-bold ml-4 mb-5'>Description: <textarea className='font-semibold ml-2'>{nft.description}</textarea> </p>
                </div>
                <div >
                  <p className='text-0.7xl font-semibold ml-4 '>Warranty: {nft.warranty} years</p>
                </div>
                <div className='p-4'>
                  <p className='text-2xl mb-4 font-semibold text-black'>₹{nft.price}</p>
                  <button className='w-full bg-orange-500 text-white font-bold py-2 px-12 rounded'
                  onClick={() => buyNft(nft)}>Buy</button> 
                </div>
                
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}