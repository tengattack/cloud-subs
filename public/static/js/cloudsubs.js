angular.module('CloudSubsApp', ['ngRoute', 'ngResource'])

.config(function ($httpProvider) {
  $httpProvider.defaults.transformRequest = function(data) {
    if (data === undefined)
      return data;

    var needMultipart = false;
    angular.forEach(data, function(value, key) {
      if (value instanceof FileList) {
        needMultipart = true;
      }
    });
    if (!needMultipart) {
      //transform to JSON
      return JSON.stringify(data);
    }

    var fd = new FormData();
    angular.forEach(data, function(value, key) {
      if (value instanceof FileList) {
        if (value.length == 1) {
          fd.append(key, value[0]);
        } else {
          angular.forEach(value, function(file, index) {
            fd.append(key + '_' + index, file);
          });
        }
      } else {
        fd.append(key, value);
      }
    });

    return fd;
  }

  $httpProvider.defaults.headers.post['Content-Type'] = undefined;
})

.directive("fileread", [function () {
  return {
    scope: {
      fileread: "="
    },
    link: function (scope, element, attributes) {
        element.bind("change", function (changeEvent) {
          scope.$apply(function () {
            //scope.fileread = changeEvent.target.files[0];
            // or all selected files:
            scope.fileread = changeEvent.target.files;
        });
      });
    }
  }
}])

.filter('kdate', function($filter) {
  var angularDateFilter = $filter('date');
  return function(theDate) {
     return angularDateFilter(theDate, 'yyyy-MM-dd HH:mm:ss Z');
  }
})

.filter('kpad2', function($filter) {
  function pad(num, size) {
    //never more than 10
    var s = '000000000' + num;
    return s.substr(s.length-size);
  }
  return function(num) {
    if (String(num).match(/[^0-9\.]/)) {
      if (parseInt(num) !== NaN) {
        var str = String(num);
        var m = str.match(/^[0-9\.]+?/);
        if (m) {
          return pad(m[0], 2) + str.substr(m[0].length);
        }
      }
      return num;
    }
    return pad(num, 2);
  }
})

.factory('User', ['$resource', function($resource) {
  return $resource('/api/user/:action', null,
    {
      'create': { method:'POST', params: { action: 'create' } },
      'login': { method:'POST', params: { action: 'login' } },
      'info': { method:'GET', params: { action: 'info' } },
      'settings': { method:'POST', params: { action: 'settings' } },
    });
}])

.factory('Tasks', ['$resource', function($resource) {
  return $resource('/api/task/:action', null,
    {
      'get': { params: { action: 'view' } },
      'create': { method:'POST', params: { action: 'create' } },
      'delete': { method:'POST', params: { action: 'delete' } },
      'query': { method:'GET', isArray: true, params: { action: 'query' } },
      'encode': { method:'POST', params: { action: 'encode' } },
      'template': { method:'GET', params: { action: 'template' } },
      'publish': { method:'GET', params: { action: 'publish' } },
      'publishnew': { method:'POST', params: { action: 'publishnew' } },
    });
}])

.factory('Bangumis', ['$resource', function($resource) {
  return $resource('/api/bangumi/:action', null,
    {
      'get': { params: { action: 'view' } },
      'create': { method:'POST', params: { action: 'create' } },
      'query': { method:'GET', isArray: true, params: { action: 'query' } }
    });
}])

.factory('Download', ['$resource', function($resource) {
  return $resource('/api/download/:action', null,
    {
      'query': { method:'GET', isArray: true, params: { action: 'query' } },
      'get': { params: { action: 'status' } },
      'add': { method:'POST', params: { action: 'add' } }
    });
}])

.factory('Subtitle', ['$resource', function($resource) {
  return $resource('/api/subtitle/:action', null,
    {
      'get': { params: { action: 'info' } },
      'upload': { method:'POST', params: { action: 'upload' } }
    });
}])

.factory('Fonts', ['$resource', function($resource) {
  return $resource('/api/font/:action', null,
  {
    'upload': { method:'POST', params: { action: 'upload' } },
    'query': { method:'GET', isArray: true, params: { action: 'query' } }
  });
}])

.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      controller:'MainCtrl',
      templateUrl:'templ/main.html'
    })
    .when('/user/create', {
      controller:'UserCreateCtrl',
      templateUrl:'templ/usercreate.html'
    })
    .when('/user/login', {
      controller:'UserLoginCtrl',
      templateUrl:'templ/userlogin.html'
    })
    .when('/user', {
      controller:'UserCtrl',
      templateUrl:'templ/user.html'
    })
    .when('/task', {
      controller:'TaskCtrl',
      templateUrl:'templ/task.html'
    })
    .when('/task/view/:id', {
      controller:'TaskViewCtrl',
      templateUrl:'templ/taskview.html'
    })
    .when('/task/publish', {
      controller:'TaskPublishCtrl',
      templateUrl:'templ/taskpublish.html'
    })
    .when('/font', {
      controller:'FontManagerCtrl',
      templateUrl:'templ/font.html'
    })
    ;
})

.controller('UserCreateCtrl', ['$scope', '$routeParams', '$location', 'User',
  function($scope, $routeParams, $location, User) {
    $scope.nickname = '';
    $scope.username = '';
    $scope.password = '';
    $scope.create = function () {
      var userinfo = {
        nickname: $scope.nickname,
        username: $scope.username,
        password: $scope.password,
      };
      User.create(userinfo, function (user) {
        if (user._id) {
          $location.path('/user/login');
        }
      });
    };
}])

.controller('UserLoginCtrl', ['$scope', '$routeParams', '$location', 'User',
  function($scope, $routeParams, $location, User) {
    $scope.login = function () {
      var userinfo = {
        username: $scope.username,
        password: $scope.password,
      };
      User.login(userinfo, function (r) {
        if (r.user) {
          $location.path('/user');
        } else if (r.message) {
          alert(r.message);
        }
      });
    };
}])

.controller('UserCtrl', ['$scope', '$routeParams', '$location', 'User',
  function($scope, $routeParams, $location, User) {
    var btsites = ['dmhy', 'ktxp', 'popgo', 'bangumi'];
    $scope.btsites = btsites;
    $scope.info = User.info({btsites: 1}, function (info) {
      if (info.islogin) {
        if (!info.btsites) {
          info.btsites = {};
          for (var i = 0; i < btsites.length; i++) {
            info.btsites[btsites[i]] = {};
          }
        }
        $scope.settings = {
          nickname: info.user.nickname,
          email: info.user.email,
          password: '',
          btsites: info.btsites,
        };
      }
    });
    $scope.saveSettings = function () {
      User.settings($scope.settings, function (info) {
        $scope.info = info;
      });
    };
}])

.controller('MainCtrl', ['$scope', '$routeParams',
  function($scope, $routeParams) {
    $scope.projects = [
      {site: '#/', name: 'main', description: 'Index Page', $id: 1},
      {site: '#/user/', name: 'user', description: 'User Page', $id: 2},
      {site: '#/font/', name: 'font', description: 'Font Page', $id: 3},
      {site: '#/task/', name: 'task', description: 'Task Page', $id: 4},
    ];
}])

.controller('TaskCtrl', ['$scope', '$routeParams', '$location', 'Tasks', 'Bangumis',
  function($scope, $routeParams, $location, Tasks, Bangumis) {
    $scope.ttasks = {};
    Tasks.query(function (tasks) {
      var t = {};
      tasks.forEach(function (task) {
        if (!t[task.bangumi]) {
          t[task.bangumi] = {};
        }
        var strepi = task.episode.toString();
        var i = 0;
        while (t[task.bangumi][strepi]) {
          i++;
          strepi = task.episode.toString() + ' (' + i + ')';
        }
        t[task.bangumi][strepi] = task._id;
      });
      $scope.ttasks = t;
    });
    $scope.bangumis = Bangumis.query();
    $scope.createTask = function () {
      Tasks.create({bangumi: $scope.bgmName, episode: $scope.episode}, function (task) {
        if (task._id) {
          $location.path('/task/view/' + task._id);
        }
      });
    };
    $scope.deleteTask = function () {
      if (!$scope.selTaskId) {
        return;
      }
      var r = confirm('Do you really want to delete task \'' + $scope.selTaskId + '\'');
      if (r !== true) {
        return;
      }
      Tasks.delete({id: $scope.selTaskId}, function (msg) {
        $scope.tasks = Tasks.query();
      });
    };
}])

.controller('TaskPublishCtrl', ['$scope', '$routeParams', '$location', 'Tasks', 'Bangumis',
  function($scope, $routeParams, $location, Tasks, Bangumis) {
    $scope.templ = Tasks.template({bangumi: $routeParams.bangumi, episode: $routeParams.episode});
    $scope.publishNew = function () {
      var pubinfo = {};
      var props = ['bangumi', 'episode', 'title', 'intro'];
      for (var i in props) {
        var key = props[i];
        pubinfo[key] = $scope.templ[key];
      }
      pubinfo.torrent_file = $scope.torrent_file;
      Tasks.publishnew(pubinfo, function (task) {
        if (task._id) {
          $location.path('/task/view/' + task._id);
        }
      });
    };
}])

.controller('TaskViewCtrl', ['$scope', '$interval', '$routeParams', 'Tasks', 'Download', 'Subtitle',
  function($scope, $interval, $routeParams, Tasks, Download, Subtitle) {

    var tar_dl = undefined, tar_task = undefined;
    var set_task = function (task) {
      if (task.opts) {
        if (task.opts._autopublish) {
          $scope.autopublish = task.opts._autopublish;
        }
        for (var k in task.opts) {
          if (k && k[0] == '_') {
            delete task.opts[k];
          }
        }
      }
      $scope.task = task;
    };
    var dl_need_refresh = function (dl) {
      return !(dl.status == 'finish'
        || dl.status == 'error'
        || dl.errno);
    };
    var autoRefreshDLStatus = function () {
      if (angular.isDefined(tar_dl)) {
        $interval.cancel(tar_dl);
        tar_dl = undefined;
      }
      if (!dl_need_refresh($scope.download)) {
        return;
      }
      tar_dl = $interval(function () {
        Download.get({id: $scope.task.download_id}, function (dl) {
          if (!dl_need_refresh(dl)) {
            $interval.cancel(tar_dl);
            tar_dl = undefined;
          }
          $scope.download = dl;
        });
      }, 2000);
    };
    var task_need_refresh = function (task) {
      var working = (task.status == 'encoding'
        || task.status == 'checking'
        || task.status == 'publishing');
      $scope.working = working;
      return working;
    };
    var autoRefreshTaskStatus = function () {
      if (angular.isDefined(tar_task)) {
        $interval.cancel(tar_task);
        tar_task = undefined;
      }
      if (!task_need_refresh($scope.task)) {
        return;
      }
      tar_task = $interval(function () {
        Tasks.get({id: $scope.task._id}, function (task) {
          if (!task_need_refresh(task)) {
            $interval.cancel(tar_task);
            tar_task = undefined;
          }
          set_task(task);
        });
      }, 10000);
    };

    $scope.working = false;
    $scope.adding = false;
    $scope.download = null;
    $scope.subtitle = null;
    Tasks.get({id: $routeParams.id}, function (task) {
      set_task(task);
      if (task.download_id) {
        Download.get({id: task.download_id}, function (dl) {
          $scope.download = dl;
          autoRefreshDLStatus();
        });
      }
      if (task.subtitle_id) {
        Subtitle.get({id: task.subtitle_id}, function (st) {
          $scope.subtitle = st;
        });
      }
      autoRefreshTaskStatus();
    });
    $scope.getDownload = function () {
      $scope.downloads = Download.query();
    };
    $scope.addDownload = function () {
      if ($scope.adding || ($scope.download && dl_need_refresh($scope.download))) {
        return;
      }
      $scope.adding = true;
      Download.add({
        task_id: $scope.task._id,
        type: $scope.dlType,
        baidupan_url: $scope.baidupan_url,
        baidupan_code: $scope.baidupan_code,
        torrent_file: $scope.torrent_file,
        download_id: $scope.download_id,
      }, function (dl) {
        $scope.adding = false;
        if (dl._id) {
          $scope.download = dl;
          $scope.task.download_id = dl._id;
          autoRefreshDLStatus();
        }
      });
    };
    $scope.uploadSubtitle = function () {
      Subtitle.upload({
        task_id: $scope.task._id,
        subtitle_file: $scope.subtitle_file,
      }, function (st) {
        if (st._id) {
          $scope.subtitle = st;
          $scope.task.subtitle_id = st._id;
        }
      });
    };
    $scope.startEncode = function () {
      var opts = $scope.task.opts;
      Tasks.encode({
          id: $scope.task._id,
          autopublish: $scope.autopublish,
          opts: $scope.task.opts
        }, function (task) {
          if (task._id) {
            set_task(task);
            autoRefreshTaskStatus();
          }
      });
    };
    $scope.publish = function () {
      Tasks.publish({ id: $scope.task._id }, function (task) {
        if (task._id) {
          set_task(task);
          autoRefreshTaskStatus();
        }
      });
    };
}])

.controller('FontManagerCtrl', ['$scope', 'Fonts',
  function($scope, Fonts) {
    $scope.fonts = [];
    $scope.uploadNewFont = function () {
      if (!$scope.font_file) {
        return;
      }
      Fonts.upload({ font_file: $scope.font_file }, function (ft) {
        if (ft) {
          if (!ft.errno) {
            $scope.fonts.unshift(ft.font);
          } else if (ft.message) {
            alert(ft.message);
          }
        }
      });
    };
    Fonts.query(function (fonts) {
      $scope.fonts = fonts;
    });
}])

.run(['$rootScope', '$location', 'User', function ($rootScope, $location, User) {
  User.info(function (info) {
    if (!info || !info.islogin) {
      $location.path('/user/login');
    }
  });
}])

;
