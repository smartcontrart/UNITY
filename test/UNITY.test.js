const UNITY = artifacts.require("./UNITY.sol");
const assert = require('assert');

contract("UNITY", accounts => {

  beforeEach(async() =>{
    nft = await UNITY.deployed();
  });
  
  it("... should deploy with less than 4.7 mil gas", async () => {
    let UNITYInstance = await UNITY.new();
    let receipt = await web3.eth.getTransactionReceipt(UNITY.transactionHash);
    console.log(receipt.gasUsed);
    assert(receipt.gasUsed <= 4700000, "Gas was more than 4.7 mil");
  });


  it("... should load the whitelist", async()=>{
    let accountsWhitelisted = [accounts[2], accounts[3], accounts[4], accounts[5], accounts[6]]

    assert(await nft.loadWL(accountsWhitelisted), 'Could not load whitelist');
    
    for(i=0; i< accountsWhitelisted.length; i++){
      assert.equal(await nft._tokensWhitelisted.call(accountsWhitelisted[i]), true, "token does not have the right amount of WL spots");
    }
  })

  it("... should mint when Admin and closed drop", async () =>{
    assert(await nft.mint(accounts[2], {from: accounts[0]}), 'Could not mint a token');
  })

  it("... should not mint with a closed drop an WLed", async () => {
    await assert.rejects(nft.mint(accounts[0], {from: accounts[2]}), 'Successfully minted without with a closed Drop');
  });

  if("... should not mint when not on the WL", async () => {
    await assert.rejects(nft.mint(accounts[7], {from: accounts[7]}), 'Successfully minted without with a closed Drop');
  });

  it(".. should mint when opened drop and on the WL", async () => {
    await nft.toggleDropState();
    await assert(nft.mint(accounts[2], {from: accounts[2]}), 'Successfully minted without with a closed Drop');
  })

  it("... should not mint more than 1 NFT",async ()=>{
    assert(await nft.mint(accounts[3], {from: accounts[3]}), "couldn't mint but should have been able to")
    await nft.safeTransferFrom(accounts[3], accounts[7], 1, 1, "0x00", {from: accounts[3]})
    await assert.rejects(nft.mint(accounts[3], {from: accounts[3]}), 'Could mint again after transferring its balance')
  })

  it("... should prevent non Admins to perform tasks", async () =>{
    await assert.rejects(nft.mint(accounts[7], 2, {from: accounts[7]}), "could use mint without being an admin");
    await assert.rejects(nft.loadWL([accounts[7]], [6], {from: accounts[7]}), 'could add to the WL but was not expected to be able to')
    await assert.rejects(nft.setRoyalties(accounts[7], 100, {from: accounts[7]}), 'could edit royalties but was not admin')
  })

  it("... should be able to burn its token", async () =>{
    let acc2balBeforeBurn = await nft.balanceOf(accounts[2], 1, {from: accounts[2]})
    assert(await nft.burn({from: accounts[2]}), "Could not burn its own token")
    let acc2balAfterBurn = await nft.balanceOf(accounts[2], 1, {from: accounts[2]})
    assert.equal(acc2balBeforeBurn-1, acc2balAfterBurn, "Did not burn his token")
  })

  it("... should add Admins", async ()=>{
    await nft.approveAdmin(accounts[7], {from: accounts[0]})
    let admins = await nft.getAdmins();
    let is7Admin = admins.includes(accounts[7]) ?  true :  false;
    assert.equal(is7Admin, true, `${accounts[7]} was not added as Admin and was expected to be`);
  })


  it("... should allow to perform tasks", async () =>{
    assert(nft.loadWL([accounts[7]], {from: accounts[7]}), 'could add to the WL')
    assert(await nft.mint(accounts[9], {from: accounts[7]}), 'Could not airdrop a token');
    let ac9Bal = await nft.balanceOf(accounts[9],1)
    assert.equal(ac9Bal.toNumber(), 1, "expected airdropped account an NFT but didn't have one")
  })

  it("... should prevent non Admins to perform tasks", async () =>{
    await assert.rejects(nft.mint(accounts[8], 2, {from: accounts[8]}), "could use mint without being an admin or WL");
    await assert.rejects(nft.loadWL([accounts[8]], [8], {from: accounts[8]}), 'could add to the WL but was not expected to be able to')
    await assert.rejects(nft.setRoyalties(accounts[8], 100, {from: accounts[8]}), 'could edit royalties but was not admin')
  })
  
  it("... should remove Admins", async ()=>{
    await nft.revokeAdmin(accounts[7], {from: accounts[0]})
    let admins = await nft.getAdmins();
    let isAdmin = admins.includes(accounts[7]) ?  true :  false;
    assert.equal(isAdmin, false, `${accounts[7]} was an Admin and was expected not to be`); 
  })
  
});
