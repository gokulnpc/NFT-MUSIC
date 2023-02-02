import { Link, Routes, Route } from "react-router-dom";
import { useState } from 'react'
import { ethers } from "ethers"
import MusicNFTMarketplaceAbi from './contract/MusicNFTMarketplace.json'
import MusicNFTMarketplaceAddress from './contract/MusicNFTMarketplace-address.json'
import { Button } from 'react-bootstrap'


import Home from './components/Home.js'
import MyTokens from './components/MyTokens.js'
import MyResales from './components/MyResales.js'
import './styles.css';

function App() {
    const [loading, setLoading] = useState(true)
    const [account, setAccount] = useState(null)
    const [contract, setContract] = useState({})

    const web3Handler = async () => {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0])
        // Get provider from Metamask
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        // Get signer
        const signer = provider.getSigner()
        loadContract(signer)
    }
    const loadContract = async (signer) => {
        // Get deployed copy of music nft marketplace contract
        const contract = new ethers.Contract(MusicNFTMarketplaceAddress.address, MusicNFTMarketplaceAbi.abi, signer)
        setContract(contract)
        setLoading(false)
    }
    return (
        <div className="App">
            <>
                <>
                    <h1>Music NFT player</h1>
                    <Link as={Link} to="/">Home</Link><br />
                    <Link as={Link} to="/my-tokens">My Tokens</Link><br />
                    <Link as={Link} to="/my-resales">My Resales</Link><br />
                    {account ? (<Button>{account.slice(0, 5) + '...' + account.slice(38, 42)}</Button>) : (
                        <Button onClick={web3Handler}>Connect Wallet</Button>
                    )}
                </>

            </>
            <div>
                {loading ? (
                    <p className='mx-3 my-0'>Awaiting Metamask Connection...</p>
                ) : (
                    <Routes>
                        <Route path="/" element={<Home contract={contract} />} />
                        <Route path="/my-tokens" element={<MyTokens contract={contract} />} />
                        <Route path="/my-resales" element={<MyResales contract={contract} account={account} />} />
                    </Routes>
                )}
            </div>
        </div>

    );
}

export default App;