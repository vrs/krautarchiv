function DAG(id) {
  this.nodes = [];
  if (id !== undefined) {
    id = +id;
    this.head = id;
    this.nodes[id] = {
      parents: [],
      children: []
    };
  }
}
DAG.prototype.append = function (parents, id) {
  id = +id;
  var nodes = this.nodes;
  if (nodes[id]) {
    return false;
  } else {
    nodes[id] = {
      parents: parents,
      children: []
    };
    parents.forEach(function (p) {
      nodes[+p].children.push(id);
    });
    return true;
  }
};
DAG.prototype.attach = function (parents, sub) {
  var nodes = this.nodes;
  if (sub.nodes.filter(function (el) {
    return nodes[el.id] !== undefined;
  }).length) {
    return false;
  } else {
    sub.nodes.forEach(function (node, i) {
      nodes[i] = node;
    });
    nodes[sub.head].parents = parents;
    parents.forEach(function (p) {
      nodes[p].children.push(sub.head);
    });
    return true;
  }
};
DAG.prototype.flatten = function () {
  // this is not a toposort!
  return this.nodes.map(function (node, i) {
    return i;
  }).filter(function (node, i) {
    return i !== undefined;
  });
};
DAG.prototype.reverse = function () {
  var out = new DAG();
  this.nodes.forEach(function (node, i) {
    if (out.head === undefined && !node.children.length) {
      out.head = i;
    }
    out.nodes[i] = {
      parents: node.children,
      children: node.parents
    };
  });
  return out;
};
DAG.prototype.descendants = function (id) {
  id = +id;
  var out = new DAG(id)
    , self = this
  ;
  self.nodes[id].children.forEach(function (child) {
    if (out.nodes[child]) {
      out.nodes[child].parents.push(id);
    } else {
      out.attach([id], self.descendants(child));
    }
  });
  return out;
};
DAG.prototype.ancestors = function (id) {
  return this.reverse().descendants(+id);
};


var postGraph = (function () {
  var cache = [];
  function addPost(post) {
    var refs = post.getElements('a[onclick^=highlightPost]');
    this.append(refs.map(getTarget).filter(function (x) {
      return $$('#delform #' + x).length;
    }), post.id);
  }
  return function (thread) {
    var id = thread.getElement('article').get('id')
      , graph = cache[id]
    ;
    if (!graph) {
      graph = new DAG(id);
      thread.getChildren('article').forEach(addPost.bind(graph));
      cache[id] = graph;
    }
    return graph;
  }
})()
