import { useState, useEffect, useRef } from 'react'
import { ethers } from "ethers"
import Identicon from 'identicon.js';
import { Card, Button, ButtonGroup } from 'react-bootstrap'

const Home = (props) => {
    const contract = props.contract;
    const [loading, setLoading] = useState(true)
    const [marketItems, setMarketItems] = useState(null) //to store market items
    const [currentItemIndex, setCurrentItemIndex] = useState(0)

    const audioRef = useRef(null); //to control when to play and pause it 
    const [isPlaying, setIsPlaying] = useState(null)



    const loadMarketplaceItems = async () => {
        // Get all unsold items/tokens 
        const results = await contract.getAllUnsoldTokens()

        const marketItems = await Promise.all(results.map(async i => {
            // get uri url from contract
            const uri = await contract.tokenURI(i.tokenId)
            // use uri to fetch the nft metadata stored on ipfs 
            const response = await fetch(uri + ".json")
            const metadata = await response.json()
            const identicon = `data:image/png;base64,${new Identicon(metadata.name + metadata.price, 330).toString()}`
            // define item object
            let item = {
                price: i.price,
                itemId: i.tokenId,
                name: metadata.name,
                audio: metadata.audio,
                identicon
            }
            return item
        }))
        setMarketItems(marketItems)
        setLoading(false)
    }

    const buyMarketItem = async (item) => {

        await (await contract.buyToken(item.itemId, { value: item.price })).wait()
        loadMarketplaceItems()

    }
    const skipSong = (forwards) => {
        if (forwards) {
            setCurrentItemIndex(() => {
                let index = currentItemIndex
                index++
                if (index > marketItems.length - 1) {
                    index = 0;
                }
                return index
            })
        } else {
            setCurrentItemIndex(() => {
                let index = currentItemIndex
                index--
                if (index < 0) {
                    index = marketItems.length - 1;
                }
                return index
            })
        }
    }
    useEffect(() => {
        if (isPlaying) {
            audioRef.current.play()
        } else if (isPlaying !== null) {
            audioRef.current.pause()
        }
    })

    //you tell React that your component needs to do something after render.
    useEffect(() => {
        !marketItems && loadMarketplaceItems()
    })

    if (loading) return (
        <h2>Loading...</h2>
    )

    return (

        <div className="container-fluid mt-5">

            {
                marketItems.length > 0 ?

                    <div className="row">
                        <br></br>

                        <div className="content mx-auto">
                            <audio src={marketItems[currentItemIndex].audio} ref={audioRef}></audio>
                            <Card>
                                <Card.Header>{currentItemIndex + 1} of {marketItems.length}</Card.Header>
                                <Card.Img variant="top" src={marketItems[currentItemIndex].identicon} />
                                <Card.Body color="secondary">
                                    <h2> {marketItems[currentItemIndex].name}</h2>

                                    <Button variant="secondary" onClick={() => skipSong(false)}>
                                        Previous
                                    </Button>
                                    <Button variant="secondary" onClick={() => setIsPlaying(!isPlaying)}>
                                        {isPlaying ? (
                                            <span>Pause</span>
                                        ) : (
                                            <span>Play</span>
                                        )}
                                    </Button>
                                    <Button variant="secondary" onClick={() => skipSong(true)}>
                                        Next
                                    </Button>

                                </Card.Body>

                                <Card.Footer>
                                    <div className='d-grid my-1'>
                                        <Button onClick={() => buyMarketItem(marketItems[currentItemIndex])} variant="primary" size="lg">
                                            {`Buy for ${ethers.utils.formatEther(marketItems[currentItemIndex].price)} ETH`}
                                        </Button>
                                    </div>
                                </Card.Footer>
                            </Card>
                        </div>

                    </div >

                    : (
                        <h2>No listed assets</h2>
                    )}

        </div >
    );
}
export default Home