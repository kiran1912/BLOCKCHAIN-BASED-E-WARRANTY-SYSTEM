//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarket is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;

    address payable owner;
    uint256 listingPrice = 0.025 ether;
    bytes32 itemName = "temp item";
    uint256 warranty = 3;


    constructor() {
        owner = payable(msg.sender);
    }

    struct MarketItem{
        uint itemId;
        address nftContract;
        uint256 tokenId;
        uint256 uniqueId;
        address payable seller;
        address payable owner;
        uint256 price;
        uint256 deliveryDate;
        uint256 warrantyPeriod;
        bool expired;
        bool sold;
    }

    mapping(uint256 => MarketItem) private idToMarketItem;

    event  MarketItemCreated(
        uint indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 uniqueId,
        address seller,
        address owner,
        uint256 price,
        uint256 deliveryDate,
        uint256 warrantyPeriod,
        bool expired,
        bool sold
    );

    function getListingPrice() public view returns(uint256) {
        return listingPrice;
    }
    function getItemName() public view returns(bytes32) {
        return itemName;
    }
    function getWarranty() public view returns(uint256) {
        return warranty;
    }

    function createMarketItem(
        address nftContract,
        uint256 tokenId,
        uint256 uniqueId,
        uint256 price,
        uint256 warrantyPeriod
    ) public payable nonReentrant {
        require(price > 0, "price must be > zero");
        require(msg.value == listingPrice, "price must be valid");

        _itemIds.increment();
        uint256 itemId = _itemIds.current();

        idToMarketItem[itemId] = MarketItem(
            itemId,
            nftContract,
            tokenId,
            uniqueId,
            payable(msg.sender),
            payable(address(0)),
            price,
            block.timestamp,
            warrantyPeriod,
            false,
            false
        );

        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        emit MarketItemCreated(
            itemId, 
            nftContract, 
            tokenId, 
            uniqueId,
            msg.sender,
            address(0),
            price,
            block.timestamp,
            warrantyPeriod,
            false,
            false
        );
    }

    function createMarketSale(
        address nftContract,
        uint256 itemId
    ) public payable nonReentrant {
        uint price = idToMarketItem[itemId].price;
        uint tokenId = idToMarketItem[itemId].tokenId;
        require(msg.value == price, "please submit asking price");

        idToMarketItem[itemId].seller.transfer(msg.value);
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
        idToMarketItem[itemId].owner = payable(msg.sender);
        idToMarketItem[itemId].deliveryDate = block.timestamp;
        idToMarketItem[itemId].sold = true;
        _itemsSold.increment();
        payable(owner).transfer(listingPrice);
    }

    function fetchMarketItems() public view returns(MarketItem[] memory) {
        uint itemCount = _itemIds.current();
        uint unsoldItemCount = _itemIds.current() - _itemsSold.current();
        uint currentIndex = 0;

        MarketItem[] memory items = new MarketItem[] (unsoldItemCount);
        for(uint i=0; i < itemCount; i++){
            if(idToMarketItem[i+1].owner == address(0)) {
                uint currentId = idToMarketItem[i+1].itemId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }

        return items;

    }

    function checkWarranty(uint i) public {
        idToMarketItem[i+1].warrantyPeriod -= (block.timestamp - idToMarketItem[i+1].deliveryDate);
        if(idToMarketItem[i+1].warrantyPeriod <= 0){
            idToMarketItem[i+1].warrantyPeriod = 0;
            idToMarketItem[i+1].expired = true;
        }
    }

    function fetchMyNFTs() public view returns (MarketItem[] memory) {
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for(uint i=0; i < totalItemCount; i++){
            if(idToMarketItem[i+1].owner == msg.sender) {
                itemCount += 1;   
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);
        for(uint i=0; i < totalItemCount; i++){
            if(idToMarketItem[i+1].owner == msg.sender) {
                if(idToMarketItem[i+1].expired == false){
                    //checkWarranty(i);
                }
                uint currentId = idToMarketItem[i+1].itemId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;   
            }
        }
        return items;
    }

    function fetchItemsCreated() public view returns (MarketItem[] memory) {
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for(uint i=0; i < totalItemCount; i++){
            if(idToMarketItem[i+1].seller == msg.sender) {
                itemCount += 1;   
            }
        }

        MarketItem[] memory items = new MarketItem[] (itemCount);
        for(uint i=0; i < totalItemCount; i++){
            if(idToMarketItem[i+1].seller == msg.sender) {
                uint currentId = idToMarketItem[i+1].itemId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }
}
