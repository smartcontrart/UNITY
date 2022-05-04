require('dotenv').config()
const WL = require("./ContractData/WL/WL.json")
const URIS = require("./ContractData/URIs/URIs.json")
var contract = artifacts.require("UNITY");
//////////////// PROD VARIABLES ///////////////////
var contract_address = process.env.PROD_CONTRACT_ADDRESS;
// const royalties_recipient_address = process.env.ROYALTIES_RECIPIENT_ADDRESS;
const WLaddresses = WL.addresses;
///////////////////////////////////////////////////

//////////////// DEV VARIABLES ///////////////////
// var contract_address = process.env.DEV_CONTRACT_ADDRESS;
// const WLaddresses = WL.test;
// const royalties_recipient_address = "0xba45e32c3D74d8db4981271542892a425CFC4a69";
///////////////////////////////////////////////////

module.exports = async function() {
    const UNITY = await contract.at(contract_address);
    // console.log(contract_address)
    // const uri = URIS.link
    
    // const royaltiesAmount = 10; //In %
            
        // //     Setting up the URI
        // console.log('Setting up the URI')
        // try{
        //     console.log(uri)
        //     let res = await UNITY.setURI(uri);
        //     console.log('Successfully set the URI')
        //     console.log(res)
        //     console.log('/////////////////////////')
        // }catch(err){console.log(err)}

        //     Load the WL
            // console.log('Loading the WL')
            // try{
            //     console.log(WLaddresses)
            //     let res = await UNITY.loadWL(WLaddresses);
            //     console.log('Successfully loaded the WL')
            //     console.log(res)
            //     console.log('/////////////////////////')
            // }catch(err){console.log(err)}

            try{
                console.log('fetching addresses mint')
                console.log(WLaddresses)
                for(i=0;i<WLaddresses.length;i++){
                    let addressBal = await UNITY.balanceOf(WLaddresses[i],1)
                    let addressTokens = addressBal.toNumber()
                    console.log(`${WLaddresses[i]} ${addressTokens}`)
                }
            }catch(err){ console.log(err)}
    
        //     Set royalties info
            // console.log('Setting royalties info')
            // try{
            //     let res = await UNITY.setRoyalties(royalties_recipient_address, royaltiesAmount);
            //     console.log('Successfully set Royalties info')
            //     console.log(res)
            //     console.log('/////////////////////////')
            // }catch(err){console.log(err)}
    // }
        console.log('program done executing - please terminate')
}