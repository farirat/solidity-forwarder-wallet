import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";
import {ethers, network} from "hardhat";

describe("Wallet", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployContractFixture() {
        const signers = await ethers.getSigners();

        const Contract = await ethers.getContractFactory("Wallet");
        const ContractInstance = await Contract.deploy();
        await ContractInstance.deployed()

        return {signers, ContractInstance};
    }

    async function deployTestTokenFixture() {
        const signers = await ethers.getSigners();

        // Deploy a test token
        const TestToken = await ethers.getContractFactory("TestToken");
        const token = await TestToken.connect(signers[2]).deploy(1000000000000000);
        await token.deployed();

        return token
    }

    async function deployWalletAndForwarder() {
        const signers = await ethers.getSigners();

        const Contract = await ethers.getContractFactory("Wallet");
        const ContractInstance = await Contract.deploy();
        await ContractInstance.deployed();

        const trx = await ContractInstance.createForwarder();
        const receipt = await trx.wait(1);
        const forewarderAddress = receipt.events[0].args['forwarderAddress'];

        return {signers, ContractInstance, forewarderAddress};
    }

    describe("Deployment", function () {
        it("Should set ownerAddress to owner's address", async function () {
            const {signers, ContractInstance} = await loadFixture(deployContractFixture);

            await expect(await ContractInstance.ownerAddress()).to.equal(signers[0].address);
        });
    });

    describe("Deposit", function () {
        it("Should emit Deposited", async function () {
            const {signers, ContractInstance} = await loadFixture(deployContractFixture);

            await expect(signers[1].sendTransaction({
                to: ContractInstance.address,
                value: ethers.utils.parseEther("1.0")
            }))
                .to.emit(ContractInstance, 'Deposited')
                .withArgs(signers[1].address, ethers.utils.parseEther("1.0"));
        });
        it("Should reject zero value deposit", async function () {
            const {signers, ContractInstance} = await loadFixture(deployContractFixture);

            await expect(signers[1].sendTransaction({
                to: ContractInstance.address,
                value: ethers.utils.parseEther("0")
            }))
                .to.be.revertedWith('Main wallet: Zero value transfer ?');
        });
    });

    describe("Create forwarder", function () {
        it("And get emit ForwarderCreated with forwarder's address", async function () {
            const {signers, ContractInstance} = await loadFixture(deployContractFixture);

            await expect(ContractInstance.createForwarder())
                .to.emit(ContractInstance, 'ForwarderCreated')
        });
        it("Anyone can do it", async function () {
            const {signers, ContractInstance} = await loadFixture(deployContractFixture);

            await ContractInstance.connect(signers[1]).createForwarder()
        });
    });

    describe("Create forwarders", function () {
        it("And get emit n ForwarderCreated with forwarders addresses", async function () {
            const {signers, ContractInstance} = await loadFixture(deployContractFixture);

            await expect(ContractInstance.createForwarders(2))
                .to.emit(ContractInstance, 'ForwarderCreated')
                .to.emit(ContractInstance, 'ForwarderCreated')
        });
        it("Anyone can do it", async function () {
            const {signers, ContractInstance} = await loadFixture(deployContractFixture);

            await expect(ContractInstance.connect(signers[1]).createForwarders(2))
                .to.emit(ContractInstance, 'ForwarderCreated')
                .to.emit(ContractInstance, 'ForwarderCreated')
        });
    });

    describe("Change a forwarder parent", function () {
        it("-God- can do it", async function () {
            const {signers, ContractInstance, forewarderAddress} = await loadFixture(deployWalletAndForwarder);
            const _random_address = '0xF9d80fe1bb6078D115d1CD16e89f05eA7F14D969'

            await ContractInstance.changeForwarderParent(forewarderAddress, _random_address)
        });
        it("and no one else !", async function () {
            const {signers, ContractInstance, forewarderAddress} = await loadFixture(deployWalletAndForwarder);
            const _random_address = '0xF9d80fe1bb6078D115d1CD16e89f05eA7F14D969'

            await expect(ContractInstance.connect(
                signers[1]).changeForwarderParent(forewarderAddress, _random_address))
                .to.be.revertedWith('Main wallet: caller is not the owner')
        });
    });

    describe("Collect tokens from a forwarder", function () {
        it("-God- can do it", async function () {
            const {signers, ContractInstance, forewarderAddress} = await loadFixture(deployWalletAndForwarder);
            const token = await loadFixture(deployTestTokenFixture);

            // Send an amount to the forwarder contract
            const _amount = 50
            await token.transfer(forewarderAddress, _amount);

            // Mark balance before
            expect(await token.balanceOf(ContractInstance.address)).to.equal(0);

            // Collect tokens from the forwarder contract
            await ContractInstance.collectForwarderTokens(forewarderAddress, token.address)

            // Expect wallet to be topped up with the collected token amount
            expect(await token.balanceOf(ContractInstance.address)).to.equal(_amount);
        });
        it("and no one else !", async function () {
            const {signers, ContractInstance, forewarderAddress} = await loadFixture(deployWalletAndForwarder);
            const token = await loadFixture(deployTestTokenFixture);

            // Send an amount to the forwarder contract
            const _amount = 50
            await token.transfer(forewarderAddress, _amount);

            // Collect tokens from the forwarder contract
            await expect(
                ContractInstance.connect(signers[1]).collectForwarderTokens(forewarderAddress, token.address))
                .to.be.revertedWith('Main wallet: caller is not the owner');
        });
        it("Forwarder must be topped up with tokens", async function () {
            const {signers, ContractInstance, forewarderAddress} = await loadFixture(deployWalletAndForwarder);
            const token = await loadFixture(deployTestTokenFixture);

            // Mark balance before
            expect(await token.balanceOf(ContractInstance.address)).to.equal(0);

            // Collect tokens from the forwarder contract
            await expect(ContractInstance.collectForwarderTokens(forewarderAddress, token.address))
                .to.be.revertedWith('Forwarder: Empty token balance !');
        });
    });

    describe("Send (withdraw) native currency", function () {
        it("-God- can do it", async function () {
            const {signers, ContractInstance} = await loadFixture(deployContractFixture);

            // Reset balances
            await network.provider.send("hardhat_setBalance", [ContractInstance.address,"0xA"]);
            await network.provider.send("hardhat_setBalance", [signers[1].address,"0x0"]);

            // Withdraw the full amount
            await expect(ContractInstance.send(signers[1].address, 10))
                .to.emit(ContractInstance, 'Transacted');

            // Post transfer balances (considering fees abstraction)
            await expect(await ethers.provider.getBalance(ContractInstance.address)).to.equal(0)
            await expect(await ethers.provider.getBalance(signers[1].address)).to.equal(10)
        });
        it("and no one else !", async function () {
            const {signers, ContractInstance} = await loadFixture(deployContractFixture);

            // Withdraw the full amount
            await expect(ContractInstance.connect(signers[2]).send(signers[1].address, 10))
                .to.be.revertedWith('Main wallet: caller is not the owner');
        });
        it("Forwarder must be topped up with tokens", async function () {
            const {signers, ContractInstance} = await loadFixture(deployContractFixture);

            // Reset balances
            await network.provider.send("hardhat_setBalance", [ContractInstance.address,"0x0"]);

            // Withdraw the full amount
            await expect(ContractInstance.send(signers[1].address, 10))
                .to.be.revertedWith('Main wallet: No balance available for this transaction !');
        });
    });

    describe("Send (withdraw) tokens", function () {
        it("-God- can do it", async function () {
            const {signers, ContractInstance, forewarderAddress} = await loadFixture(deployWalletAndForwarder);
            const token = await loadFixture(deployTestTokenFixture);

            // Send an amount to the forwarder contract
            const _amount = 50
            await token.transfer(ContractInstance.address, _amount);

            // Before
            expect(await token.balanceOf(ContractInstance.address)).to.equal(_amount);
            expect(await token.balanceOf(signers[1].address)).to.equal(0);

            // Collect tokens from the wallet
            await expect(ContractInstance.sendToken(signers[1].address, 50, token.address))
                .to.emit(ContractInstance, 'TransactedToken');

            // After
            expect(await token.balanceOf(ContractInstance.address)).to.equal(0);
            expect(await token.balanceOf(signers[1].address)).to.equal(_amount);
        });
        it("and no one else !", async function () {
            const {signers, ContractInstance, forewarderAddress} = await loadFixture(deployWalletAndForwarder);
            const token = await loadFixture(deployTestTokenFixture);

            // Collect tokens from the wallet
            await expect(ContractInstance.connect(signers[2]).sendToken(signers[1].address, 50, token.address))
                .to.be.revertedWith('Main wallet: caller is not the owner');
        });
        it("Forwarder must be topped up with tokens", async function () {
            const {signers, ContractInstance, forewarderAddress} = await loadFixture(deployWalletAndForwarder);
            const token = await loadFixture(deployTestTokenFixture);

            // Collect tokens from the wallet
            await expect(ContractInstance.sendToken(signers[1].address, 150, token.address))
                .to.be.revertedWith('Main wallet: Empty token balance !');
        });
    });
});
