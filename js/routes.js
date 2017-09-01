angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider
    
  

      .state('tabsController.home', {
    url: '/page2',
    views: {
      'tab1': {
        templateUrl: 'templates/home.html',
        controller: 'homeCtrl'
      },
      'menuContent': {
        templateUrl: 'templates/home.html',
    controller:'HomeCtrl'
      }
    }
  })

  .state('tabsController.search', {
    url: '/page3',
    views: {
      'tab2': {
        templateUrl: 'templates/search.html',
        controller: 'searchCtrl'
      }
    }
  })

  .state('tabsController.maps', {
    url: '/page4',
    views: {
      'tab3': {
        templateUrl: 'templates/maps.html',
        controller: 'mapsCtrl'
      }
    }
  })

  .state('tabsController', {
    url: '/page1',
    templateUrl: 'templates/tabsController.html',
    abstract:true
  })

  .state('tabsController.favorite', {
    url: '/page5',
    views: {
      'tab4': {
        templateUrl: 'templates/favorite.html',
        controller: 'favoriteCtrl'
      }
    }
  })

  .state('tabsController.gamebox', {
    url: '/page6',
    views: {
      'tab5': {
        templateUrl: 'templates/gamebox.html',
        controller: 'gameboxCtrl'
      }
    }
  })

$urlRouterProvider.otherwise('/page1/page2')

});