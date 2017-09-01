angular.module('app', ['ionic', 'app.controllers', 'app.routes', 'app.directives','app.services', 'ngCordova', 'ngStorage'])

.config(function($ionicConfigProvider, $sceDelegateProvider){
  
  $ionicConfigProvider.tabs.position('bottom');     // tabs to bottom for android
  $ionicConfigProvider.navBar.alignTitle('center')  // title to center for android
  $sceDelegateProvider.resourceUrlWhitelist([ 'self','*://www.youtube.com/**', '*://player.vimeo.com/video/**']);

})

.run(function($ionicPlatform, $http, $ionicPopup, $cordovaInAppBrowser, PositionService, $timeout) {

  // 처음 어플을 실행 시 유저 현위치 초기화
  PositionService.setPosition('', '', '', 0);

  var version = 57;
  $http.get('http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/getVersionCode.php').then(function(resp){
    if(resp.data == 0){
      alert("현재 서버 점검중입니다.");
      ionic.Platform.exitApp();
    }
    else if(resp.data != version){
      alert("새로운 버전이 업데이트되어 플레이스토어로 이동합니다.");
      $timeout(function(){ 
        window.open("market://details?id=com.b2come.pcroom", "_system");
        ionic.Platform.exitApp();
      }, 3000);
    }
  });

  $ionicPlatform.ready(function() {
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
     cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if (window.StatusBar) {
      StatusBar.backgroundColorByHexString("#45beff");
    }
  });
  
})

.directive('disableSideMenuDrag', ['$ionicSideMenuDelegate', '$rootScope', function($ionicSideMenuDelegate, $rootScope) {
    return {
        restrict: "A",  
        controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {

            function stopDrag(){
              $ionicSideMenuDelegate.canDragContent(false);
            }

            function allowDrag(){
              $ionicSideMenuDelegate.canDragContent(true);
            }

            $rootScope.$on('$ionicSlides.slideChangeEnd', stopDrag);
            $element.on('touchstart', stopDrag);
            $element.on('touchend', stopDrag);
            $element.on('mousedown', stopDrag);
            $element.on('mouseup', stopDrag);

        }]
    };
}])

.directive('hrefInappbrowser', function() {
  return {
    restrict: 'A',
    replace: false,
    transclude: false,
    link: function(scope, element, attrs) {
      var href = attrs['hrefInappbrowser'];

      attrs.$observe('hrefInappbrowser', function(val){
        href = val;
      });
      
      element.bind('click', function (event) {

        window.open(href, '_system', 'location=yes');

        event.preventDefault();
        event.stopPropagation();

      });
    }
  };
});