import React, { Component } from "react";
import UNITY  from "./contracts/UNITY.json";
import ash  from "./contracts/fakeASH.json";
// import ash  from "./contracts/Ash.json";
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Badge from 'react-bootstrap/Badge';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import background from "./images/background.png";
import Web3 from "web3";


import "./App.css";

class App extends Component {
  state = {
    account: null,
    networkId: null,
    dropLive: false,
    walletAshBalance: null,
    isWhitlisted: null,
    tokensClaimed: null,
    transactionInProgress: false,
    userFeedback: null,
    contractAllowance: null,
    priceInAsh: 18*10**18,
    dropDate: Date.parse('09 Mar 2022 15:00:00 GMT'),
    dropEnd: Date.parse('11 Mar 2022 15:00:00 GMT'),
    dateNow: Date.now()
  }

  componentDidMount = async () => {
    if(this.state.dateNow >= this.state.dropDate  && this.state.dateNow <= this.state.dropEnd){
      this.setState({dropLive: true});
    }else{
      this.startTimer();
    }
    if (window.ethereum) {
      this.web3 = new Web3(window.ethereum);
    } else if (window.web3) {
      this.web3  = new Web3(window.web3.currentProvider);
    };
    if(this.web3){
      await this.setNetwork();
      await this.getContractsInstances();
      await this.setAccount();
    }
  }

  async getContractsInstances(){
    this.networkId = await this.web3.eth.net.getId();
    this.deployedNetwork = UNITY.networks[this.networkId];
      this.UNITYInstance = new this.web3.eth.Contract(
        UNITY.abi,
        parseInt(process.env.REACT_APP_MAINNET_NETWORK) && process.env.REACT_APP_MAINNET_CONTRACT_ADDRESS
      )
      this.ashInstance = new this.web3.eth.Contract(
        ash.abi,
        parseInt(process.env.REACT_APP_MAINNET_NETWORK) && process.env.REACT_APP_MAINNET_ASH_ADDRESS
      )
  }

  async setAccount(){
    if(this.state.networkId === parseInt(process.env.REACT_APP_MAINNET_NETWORK)){
      let accounts = await this.web3.eth.getAccounts();
      this.setState({account: accounts[0]});
      if(this.state.account) this.getAccountsData()
    }else{
      this.resetAccountData();
    }
  }

  resetAccountData(){
    this.setState({
      account: null,
      isWhitlisted: null,
      walletAshBalance: null,
      tokensClaimed: null,
    })
  }

  async setNetwork(){
    if(this.web3){
      let networkId = await this.web3.eth.net.getId();
      this.setState({networkId: networkId})
    }
  }

  async getAccountsData(){
    if(this.state.networkId === parseInt(process.env.REACT_APP_MAINNET_NETWORK) ){
      this.setState({
        isAdmin: await this.UNITYInstance.methods.isAdmin(this.state.account).call(),
        isWhitlisted: await this.UNITYInstance.methods._tokensWhitelisted(this.state.account).call(),
        walletAshBalance: parseFloat(await this.ashInstance.methods.balanceOf(this.state.account).call()),
        contractAllowance: parseInt(await this.ashInstance.methods.allowance(this.state.account, process.env.REACT_APP_MAINNET_CONTRACT_ADDRESS).call()),
        tokensClaimed: await this.UNITYInstance.methods._tokensClaimed(this.state.account).call(),
      });
    }
  }

  async connectWallet(){
    this.setState({transactionInProgress: true})
    try{
      window.ethereum.enable()
    }catch(error){
      console.log(error)
    }
    this.setState({transactionInProgress: false})
  }

  revokeAshApproval(){
    this.ashInstance.methods.decreaseAllowance(process.env.REACT_APP_MAINNET_CONTRACT_ADDRESS, this.state.contractAllowance.toString()).call()
  }

  renderConnexionStatus(){
    if(this.state.account){
      return(
        <React.Fragment>
          <p>Your Ash balance: {Math.floor(this.state.walletAshBalance/(10**18))}</p>
          <span id='connexion_info'><small>Connected as <b>{this.state.account}</b></small></span>
          <span id='connexion_info'><small>Contract address <b><a className="etherscan_link" href={"https://etherscan.io/address/"+process.env.REACT_APP_MAINNET_CONTRACT_ADDRESS}>{process.env.REACT_APP_MAINNET_CONTRACT_ADDRESS}</a></b></small></span>
          {/* <span id='connexion_info'><small>The contract is approved to spend {this.state.contractAllowance/10**18} ASH on your behalf. {this.state.contractAllowance ? <a onClick={()=>this.revokeAshApproval()}>Revoke</a> : null}</small></span> */}
          <span id='connexion_info'><small>The contract is approved to spend {this.state.contractAllowance/10**18} ASH on your behalf. <a className="etherscan_link" href={"https://etherscan.io/tokenapprovalchecker?search="+this.state.account}>Revoke</a></small></span>
        </React.Fragment>
      )
    }
  }

  handleMintClick = async(amount) => {
    this.setState({
      transactionInProgress: true,
      userFeedback: "...approving ash..."})
    try{
      let price = this.state.priceInAsh * amount
      if(this.state.contractAllowance < price){
        await this.ashInstance.methods.approve(this.UNITYInstance._address, price.toString()).send({from: this.state.account})
      }
      this.setState({
        userFeedback: "...minting..."})
      await this.UNITYInstance.methods.mint(this.state.account).send({from: this.state.account});
    }catch(error){
      alert(error)
    }
    this.setAccount()
    this.setState({transactionInProgress: false,
      userFeedback: null})
  }

  renderButton(tokenNumber){
    if(this.state.walletAshBalance >= this.state.priceInAsh ){
      return(
        <Button id="mint_button" variant='light' onClick={() => this.handleMintClick(tokenNumber)}>Mint !</Button> 
      )
    }else{
      return(
        <Badge id="wl_badge" text="dark" bg="light">Not enough Ash to mint</Badge>
      )
    }
  }

  renderOneMintButton(){
    return(
      <React.Fragment>
        {this.renderButton(1)}
      </React.Fragment>
    )
  }

  renderClaimBadge(){
    return <Badge id="wl_badge" text="dark" bg="light">NFT Claimed</Badge>
  }

  startTimer(){
    this.myInterval = setInterval(() => {
      this.setState(({ dateNow: dateNow }) => ({
        dateNow: Date.now()
      }))
    }, 1000)
  }

  renderTimer(){
    let secondsToDrop = Math.floor((this.state.dropDate - this.state.dateNow)/1000);
    if(secondsToDrop<=0) this.setState({dropLive: true})
    let timeConsidered = 0
    let days = Math.floor(secondsToDrop/(60*60*24))
    timeConsidered += days*60*60*24
    let hours = Math.floor((secondsToDrop-timeConsidered)/(60*60))
    timeConsidered += hours*60*60
    let minutes = Math.floor((secondsToDrop-timeConsidered)/(60))
    timeConsidered += minutes*60
    let seconds = (secondsToDrop-timeConsidered)
    return ` ${days < 10 ? '0' + days : days} : ${hours < 10 ? '0' + hours : hours} : ${minutes < 10 ? '0' + minutes : minutes}  : ${seconds < 10 ? '0' + seconds : seconds} `
  }

  renderUserInterface(){
    if(this.web3){
      if(this.state.dropLive){
        if(this.state.transactionInProgress){
          return(
            <React.Fragment>
              <Spinner animation="grow" variant="light"/>
              <span>{this.state.userFeedback}</span>
            </React.Fragment>
          )
        }else{
          if(this.state.networkId !== parseInt(process.env.REACT_APP_MAINNET_NETWORK)){
            return(<p>Please connect your wallet to MAINNET</p>)
          }else if(!this.state.account){
            return(
              <Button id="connect_button" variant='dark' onClick={() => this.connectWallet()}>Connect your wallet</Button> 
            )
          }else{
            if(this.state.isWhitlisted){
              if(this.state.tokensClaimed === false){
                return this.renderOneMintButton();
              }else{
                return this.renderClaimBadge();
              }
            }else{
              return <Badge id="wl_badge" text="dark" bg="light">You're not on the WL</Badge>
            }
          }
        }
      }else if(!this.state.dropLive){
        return(
          <div>
           Drop opens in {this.renderTimer()}
          </div>
        )
      }else{
        return(
          <div>
            Drop closed
          </div>
        )
      }
    }else{
      return(
        <Alert id="web3_alert" variant="dark">No Wallet detected</Alert>
      )
    }
  }

  render() {
    console.log(this.state)
    if(this.web3 && this.state.dropLive){
      window.ethereum.on('accountsChanged', async () => {
        await this.setAccount()
      })
      window.ethereum.on('chainChanged', async (chainId) => {
        await this.setNetwork(chainId)
        await this.setAccount();
      });
    }
    return (
      <div className="App background" style={{
        backgroundImage: `url(${background})`,
        backgroundPosition: 'center',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat'}}>
          <Row id="App_row">
            <Row id="title_row">
              <h1 className="title"><b>UNITY</b></h1>
              <span className="subtitle">ASH EXCLUSIVE DROP BY HOXID</span>
            </Row>
            <Row id="button_row">
              <div>
                Drop closed
              </div>
            </Row>
            <Row id="about_row">
              {/* <span>A dream within a dream is a dynamic NFT.</span> */}
              <span>{this.state.priceInAsh/10**18} ASH</span> 
              <span>Whitelist only</span> 
            </Row>
            <Row id="connexion_status">
              {this.renderConnexionStatus()}
            </Row>
          </Row>
      </div>
    );
  }
  
}

export default App;

