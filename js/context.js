window.highlightPost = function highlightPost(){} // TODO sigh

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
      parents : parents,
      children : []
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
  var out = new DAG(id),
    self = this;
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


// TODO idea: move contexted posts right instead of duplicating them

function getTarget (a) {
  return a.get('href').match(/\d+/g).pop();
}

function clonePost (p) {
  var post = p.clone();
  post.set('id', 'c' + p.id);
  // TODO eww
  post.getElements('a[onclick^=highlightPost]').forEach(function (el) {
    el.set('href', el.get('href').replace('#','#c'))
  });
  return post;
}

var postCache
  , preview = (function () {
      var previewBox = new Element('div[id=preview]')
        , status = []
      ;

      function loadPost(num, callback) {
        new Request.HTML({
          url: '/res/' + window.boardName + '/post/' + num,
          onSuccess: function (responseTree) {
            var post = Array.from(responseTree).filter(function (el) {
              return el.match && el.match('article')
            })[0];
            if (!$(num)) {
              postCache.grab(post);
            }
            post.addClass('highlight');
            callback(post);
          }
        }).get();
      }

      function showPost(p, pos) {
        previewBox.empty()
          .grab( clonePost(p) )
          .setStyles({left: pos.x + 5, top: pos.y - p.getSize().y/2})
          .removeClass('hidden')
          .inject(document.body);
      }

      return {
        show : function (num, pos, callback) {
          if ($(num))
            $(num).addClass('highlight');
          
          var p = $('c'+num) || $(num)
            , size = window.getSize()
            , coords = p && p.getCoordinates()
            , isVisible = p && coords.bottom > window.scrollY &&
              window.scrollY + size.x > coords.top
            , isEntirelyVisible = p && coords.top > window.scrollY &&
              window.scrollY + size.x > coords.bottom
          ;

          if (p) {
            if (!isEntirelyVisible) {
              showPost(p, pos);
            }
            if (isVisible) {
              p.addClass('highlight');
            }
            callback();
          } else {
            if (!status[+num]) {
              loadPost(num, function (post) {
                if (status[+num] !== "aborted") {
                  showPost(post, pos, previewBox);
                  callback();
                  status[+num] = "loaded";
                }
              });
            }
            status[+num] = "loading";
          }
        },
        hide : function (num) {
          var posts = $$('#' + num + ',#c' + num);
          status[+num] = "aborted";
          posts.removeClass('highlight');
          previewBox.addClass('hidden').empty();
        }
      };
    })()
  // works in threads only. TODO
  , context = (function () {
      function createPostGraph(OP) {
        var graph = new DAG(OP);
        graph.addPost = function (post) {
          var refs = post.getElements('a[onclick^=highlightPost]');
          graph.append(refs.map(getTarget).filter(function (x) {
            return $$('#delform #' + x).length;
          }), post.id);
        }
        return graph;
      }

      function exclude (arr, without) {
        return arr.filter(function (x) {
          return !(without.indexOf(x) >= 0);
        })
      }

      return {
        show : function (num, highlight) {
          var posts = $$('article article')
            , OPid = $$('.thread_OP')[0].id
            , postgraph = createPostGraph(OPid)
            , ancwrap = $('ancwrap') || new Element('div#ancwrap.context', { html: '<div id=ancbox>' })
            , deswrap = $('deswrap') || new Element('div#deswrap.context', { html: '<div id=desbox>' })
            , ancbox = ancwrap.firstChild.empty()
            , desbox = deswrap.firstChild.empty()
            , dummy = new Element('div#dummy.dummy')
            , ancestors
            , descendants
          ;
          // generate the graph every time - we can optimize this later
          posts.forEach(postgraph.addPost);
          
          descendants = exclude(postgraph.descendants(num).flatten(), [+num]);
          ancestors = exclude(postgraph.ancestors(num).flatten(), [+num]);
          
          ancestors.forEach(function (i) {
              ancbox.grab(clonePost($(''+i)));
          });
          descendants.forEach(function (i) {
              desbox.grab(clonePost($(''+i)));
          });

          ancbox.getFirst('#c' + highlight).addClass('highlight');
          if (ancestors.length) $(num).grab(ancwrap, 'before');
          if (descendants.length) $(num).grab(deswrap, 'after');
        },
        hide : function () {
          $$('#ancwrap, #deswrap').dispose()
        }
      }
    })()
;


window.addEvent('domready', function() {
  postCache = new Element('div[id=post_cache]').inject(document.body);
  
  if ($('delform'))
    $('delform').addEvents({ // TODO eww
      'mouseenter:relay(a[onclick^=highlightPost])': function (ev, tgt) {
        var coords = tgt.getCoordinates();
        tgt.addClass('progress');
    
        preview.show(getTarget(tgt),
          {x: coords.right, y: (coords.top + coords.bottom) / 2},
          function () { tgt.removeClass('progress'); });
      },
      'mouseleave:relay(a[onclick^=highlightPost])': function (ev, tgt) {
        tgt.removeClass('progress');
        preview.hide(getTarget(tgt));
      },
      'click:relay(a[onclick^=highlightPost])': function (ev, tgt) {
        var id = +getTarget(tgt);

        if ($$('#delform #' + id).length && window.threadNum) {
          ev.preventDefault();
          if (!tgt.match('.context *')) {
            preview.hide(getTarget(tgt));
            context.hide();
            context.show(tgt.getParent('article').id, id);
          }
        }
      }
    });
    document.body.addEvent('click', function (ev) {
      if (!ev.target.match('.context, .context *, a[onclick^=highlightPost]')) {
        context.hide();
      }
    });
})
