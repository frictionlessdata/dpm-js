var archy = require('archy')
  , flat = require('flat')
  , path = require('path');


exports.deps = function (dpkgs){

  var tree = {
    label: '.',
    nodes: [{
      label: 'datapackages',
      nodes: []
    }]
  };

  dpkgs.forEach(function(dpkg){
    tree.nodes[0].nodes.push(getDpkgNode(dpkg));
  });    

  return archy(tree);
};


exports.dpkg = function(dpkg){

  var tree = {
    label: '.',
    nodes: [{
      label: dpkg.name,
      nodes: ['datapackage.json']
    }]
  };

  var dataNodes = getDataNodes(dpkg);
  if(dataNodes){
    tree.nodes[0].nodes.push(dataNodes);
  }

  return archy(tree);
};


function getDpkgNode(dpkg){
  var node = {
    label: dpkg.name,
    nodes: ['datapackage.json']
  };

  var dataNodes = getDataNodes(dpkg);
  if(dataNodes){
    node.nodes.push(dataNodes);
  }

  return node;
};


function getDataNodes(dpkg){

  var dataNodes = [];
  dpkg.resources = dpkg.resources || [];
  dpkg.resources.forEach(function(r){
    if('path' in r){
      dataNodes.push(path.basename(r.path));
    }
  });

  if(dataNodes.length){
    return {
      label: 'data',
      nodes: dataNodes
    };
  }

};


exports.clone = function(paths){

  return archy(reformat(unflatten(paths))[0]);

};


function unflatten(paths){

  var obj = {};

  paths.forEach(function(p){
    obj[p] = path.basename(p);      
  });
      
  return flat.unflatten(obj, {delimiter: path.sep});
};


/**
 * inspired from https://github.com/hughsk/file-tree
 */
function reformat(object) {
  if (typeof object !== 'object') return object;

  var entries = [];
  var entry;

  for (var key in object) {
    entry = reformat(object[key]);
    if (typeof entry === 'string') {
      entry.label = key;
      entries.push(entry);
    } else {
      entry = { nodes: entry, label: key };
      entries.push(entry);
    }
  }

  return entries;
};
