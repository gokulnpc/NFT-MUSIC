// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MusicNFTMarketplace is ERC721("NPCFi", "NPC"), Ownable {
    string public baseURI =
        "https://bafybeiboclp6bev4s4v6mtjp3os42ceivv6djcqeo3ymvxw3ln6kksaenq.ipfs.nftstorage.link/";
    string public baseExtension = ".json";
    address public artist;
    uint256 public royaltyFee;

    struct MarketItem {
        uint256 tokenId;
        address payable seller; //inorder to seller address to receive ether payment we need to mark it as payable
        uint256 price;
    }
    MarketItem[] public marketItems;

    /* In constructor we initalize royalty fee, artist address and prices of music nfts*/
    /* deployer is seller of all nfts intially */
    constructor(
        uint256 _royaltyFee,
        address _artist,
        uint256[] memory _prices
    ) payable {
        require(
            _prices.length * _royaltyFee <= msg.value,
            "Deployer must pay royalty fee for each token listed on the marketplace"
        );
        royaltyFee = _royaltyFee;
        artist = _artist;
        for (uint8 i = 0; i < _prices.length; i++) 
        {
            require(_prices[i] > 0, "Price must be greater than 0");
            _mint(address(this), i); //address(this) -> contract address
            marketItems.push(MarketItem(i, payable(msg.sender), _prices[i]));
            //msg.sender -> seller address or deployer address
        }
    }

    event MarketItemBought(
        uint256 indexed tokenId,
        address indexed seller,
        address buyer,
        uint256 price
    );
    event MarketItemRelisted(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );

    
    /* Updates the royalty fee of the contract */
    function updateRoyaltyFee(uint256 _royaltyFee) external onlyOwner {
        royaltyFee = _royaltyFee;
    }

    /* Creates the sale of a music nft listed on the marketplace */
    /* Transfers ownership of the nft, as well as funds between parties */
    function buyToken(uint256 _tokenId) external payable {
        uint256 price = marketItems[_tokenId].price;
        address seller = marketItems[_tokenId].seller;
        require(
            msg.value == price,
            "Please send the asking price in order to complete the purchase"
        );
        marketItems[_tokenId].seller = payable(address(0));//to indicate that item has been sold

        //contract address holds the item (coz it was minted using contract address)
        //msg.sender -> buyers address
        //ownership is transferred to msg.sender -> buyer
        _transfer(address(this), msg.sender, _tokenId);
        payable(artist).transfer(royaltyFee);
        payable(seller).transfer(msg.value);
        emit MarketItemBought(_tokenId, seller, msg.sender, price);
    }

    /* Allows someone to resell their music nft */
    //_price =? new asking price
    function resellToken(uint256 _tokenId, uint256 _price) external payable {
        //inorder to sell it must pay royalty fee to artist
        require(msg.value == royaltyFee, "Must pay royalty");
        require(_price > 0, "Price must be greater than zero");
        marketItems[_tokenId].price = _price;
        marketItems[_tokenId].seller = payable(msg.sender); //previously payable(address(0))

        //item will be transferred to contract address from 
        _transfer(msg.sender, address(this), _tokenId);
        emit MarketItemRelisted(_tokenId, msg.sender, _price);
    }

    /* Fetches all the tokens currently listed for sale */
    function getAllUnsoldTokens() external view returns (MarketItem[] memory) {
        uint256 unsoldCount = balanceOf(address(this));// returns no of nft in contract address
        MarketItem[] memory tokens = new MarketItem[](unsoldCount);
        uint256 currentIndex;
        for (uint256 i = 0; i < marketItems.length; i++) {
            if (marketItems[i].seller != address(0)) {
                tokens[currentIndex] = marketItems[i];
                currentIndex++;
            }
        }
        return (tokens);
    }

    /* Fetches all the tokens owned by the user */
    function getMyTokens() external view returns (MarketItem[] memory) {
        uint256 myTokenCount = balanceOf(msg.sender);
        MarketItem[] memory tokens = new MarketItem[](myTokenCount);
        uint256 currentIndex;
        for (uint256 i = 0; i < marketItems.length; i++) {
            //returns owner of the nft
            if (ownerOf(i) == msg.sender) {
                tokens[currentIndex] = marketItems[i];
                currentIndex++;
            }
        }
        return (tokens);
    }

    /* Internal function that gets the baseURI initialized in the constructor */
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }
}
