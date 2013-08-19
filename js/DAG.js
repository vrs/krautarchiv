// beware when modifying lists that might have a meaning in more than one DAG
function DAG(id) {
  this.nodes = {};
  if (id !== undefined) {
    this.head = id;
    this.nodes[id] = {
      parents: [],
      children: []
    };
  }
}
DAG.prototype.append = function (parents, id) {
  var nodes = this.nodes;
  if (nodes[id]) {
    return false;
  } else {
    // link upwards
    nodes[id] = {
      parents: parents,
      children: []
    };
    // link downwards
    parents.forEach(function (p) {
      nodes[p].children.push(id);
    });
    return true;
  }
};
DAG.prototype.attach = function (parents, sub) {
  var nodes = this.nodes;

  // copy over nodes
  for (var i in sub.nodes) {
    nodes[i] = sub.nodes[i];
  }
  // attach head
  nodes[sub.head].parents = parents;
  parents.forEach(function (p) {
    nodes[p].children.push(sub.head);
  });
  return true;
};
DAG.prototype.flatten = function () {
  // this is not a toposort!
  return Object.keys(this.nodes).sort(function (a, b) {
    return +a - b;
  })
};
DAG.prototype.reverse = function () {
  var out = new DAG()
    , nodes = this.nodes
  ;
  for (var i in nodes) {
    // choose an element that has no children in nodes as head
    // no specific preference
    if (out.head === undefined && !nodes[i].children.length) {
      out.head = i;
    }
    // point the links the other way
    out.nodes[i] = {
      parents: nodes[i].children,
      children: nodes[i].parents
    };
  }
  return out;
};
DAG.prototype.descendants = function (id) {
  var out = new DAG(id)
    , self = this
  ;
  // copy descendants into sub-DAG
  self.nodes[id].children.forEach(function (child) {
    if (out.nodes[child]) {
      // already visited by another branch, just add a link
      out.nodes[child].parents.push(id);
      out.nodes[id].children.push(child);
    } else {
      out.attach([id], self.descendants(child));
    }
  });
  return out;
};
DAG.prototype.ancestors = function (id) {
  return this.reverse().descendants(id);
};
