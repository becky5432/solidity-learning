pragma solidity ^0.8.28;

//deposit / withdraw
//user --> deposit --> TinyBank --> transfer(user --> TinyBank)
interface IMyToken {
    function transfer(uint256 amount, address to) external;

    function transferFrom(address from, address to, uint256 amount) external;

    function mint(uint256 amount, address owner) external;
}

contract TinyBank {
    event Staked(address from, uint256 amount);
    event Withdraw(uint256 amount, address to);

    IMyToken public stakingToken;

    mapping(address => uint256) public lastClaimedBlock;
    address[] public stakedUsers;
    uint256 rewardPerBlock = 1 * 10 ** 18;

    mapping(address => uint256) public staked;
    uint256 public totalStaked;

    constructor(IMyToken _stakingToken) {
        stakingToken = _stakingToken;
    }

    modifier updateReward(address to) {
        if (staked[to] > 0) {
            uint256 blocks = block.number - lastClaimedBlock[to];
            uint256 reward = (blocks * rewardPerBlock * staked[to]) /
                totalStaked;
            stakingToken.mint(reward, to);
        }
        lastClaimedBlock[to] = block.number;
        _; //caller
    }

    function stake(uint256 _amount) external updateReward(msg.sender) {
        require(_amount >= 0, "cannot stake 0 amount");
        stakingToken.transferFrom(msg.sender, address(this), _amount);
        staked[msg.sender] += _amount;
        totalStaked += _amount;
        stakedUsers.push(msg.sender);
        emit Staked(msg.sender, _amount);
    }

    function withdraw(uint256 _amount) external updateReward(msg.sender) {
        require(staked[msg.sender] >= _amount, "insufficient staked token");
        stakingToken.transfer(_amount, msg.sender);
        staked[msg.sender] -= _amount;
        totalStaked -= _amount;
        if (staked[msg.sender] == 0) {
            uint256 index;
            for (uint i = 0; i < stakedUsers.length; i++) {
                if (stakedUsers[i] == msg.sender) {
                    index = i;
                    break;
                }
            }
            stakedUsers[index] = stakedUsers[stakedUsers.length - 1];
            stakedUsers.pop();
        }
        emit Withdraw(_amount, msg.sender);
    }
}
