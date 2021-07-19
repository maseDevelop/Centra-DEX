//SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.22 <0.9.0;

//Import RBTree library
import "./BokkyPooBahsRedBlackTreeLibrary.sol";

// ----------------------------------------------------------------------------
// BokkyPooBah's Red-Black Tree Library v1.0-pre-release-a - Contract for testing
//
// A Solidity Red-Black Tree binary search library to store and access a sorted
// list of unsigned integer data. The Red-Black algorithm rebalances the binary
// search tree, resulting in O(log n) insert, remove and search time (and ~gas)
//
// https://github.com/bokkypoobah/BokkyPooBahsRedBlackTreeLibrary
//
//
// Enjoy. (c) BokkyPooBah / Bok Consulting Pty Ltd 2020. The MIT Licence.
// ----------------------------------------------------------------------------
contract TestBokkyPooBahsRedBlackTreeRaw {
    using BokkyPooBahsRedBlackTreeLibrary for BokkyPooBahsRedBlackTreeLibrary.Tree;

    BokkyPooBahsRedBlackTreeLibrary.Tree tree;

    event Log(string where, uint key, uint value);

    constructor() {
    }
    function root() public view returns (uint _key) {
        _key = tree.root;
    }
    function first() public view returns (uint _key) {
        _key = tree.first();
    }
    function last() public view returns (uint _key) {
        _key = tree.last();
    }
    function next(uint key) public view returns (uint _key) {
        _key = tree.next(key);
    }
    function prev(uint key) public view returns (uint _key) {
        _key = tree.prev(key);
    }
    function exists(uint key) public view returns (bool _exists) {
        _exists = tree.exists(key);
    }
    function getNode(uint _key) public view returns (uint key, uint parent, uint left, uint right, uint price, bool red) {
        (key, parent, left, right, price, red) = tree.getNode(_key);
    }

    function getBestKey(uint _min, uint _max) public view returns (uint _key) {
        _key = tree.getBestKey(_min, _max);
    }

    function insert(uint price, uint id) public {
        tree.insert(price, id);
        // emit Log("insert", _key, 0);
    }
    function remove(uint _key) public {
        tree.remove(_key);
        // emit Log("remove", _key, 0);
    }
}