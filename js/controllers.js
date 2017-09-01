angular.module('app.controllers', [])
  
.controller('menuCtrl', ['$scope', '$stateParams', '$state', '$q', 'UserService', '$ionicLoading', 
    '$ionicModal', 'SignService', '$http', 'DBuserIdService', '$cordovaToast', 
function ($scope, $stateParams, $state, $q, UserService, $ionicLoading, 
    $ionicModal, SignService, $http, DBuserIdService, $cordovaToast) {

    //////////////////////////////////////////////////////////////////////////////////////////////////
    // 고객센터 / 문의사항 모달
    $scope.showmodalhelp = function(){
        $ionicModal.fromTemplateUrl('templates/modal-help.html', {
            scope: $scope,
            animation: 'scale-in',
        }).then(function(modal) {
            $scope.modalhelp = modal;
            $scope.modalhelp.show();
        });
    }; // modal show

    $scope.hidemodalhelp = function(){
        $scope.modalhelp.remove();
    }; // modal remove
    //////////////////////////////////////////////////////////////////////////////////////////////////

    //////////////////////////////////////////////////////////////////////////////////////////////////
    // 환경설정 모달
    $scope.showmodalsetting = function(){
        $ionicModal.fromTemplateUrl('templates/modal-setting.html', {
            scope: $scope,
            animation: 'scale-in',
        }).then(function(modal) {
            $scope.modalsetting = modal;
            $scope.modalsetting.show();
        });
    }; // modal show

    $scope.hidemodalsetting = function(){
        $scope.modalsetting.remove();
    }; // modal remove
    //////////////////////////////////////////////////////////////////////////////////////////////////

    //////////////////////////////////////////////////////////////////////////////////////////////////
    // 페이스북 로그인 / 로그아웃
    $scope.isLogin = SignService.getsign(); // 로그인 버튼을 화면에 보여주기 위한 변수

    if(SignService.getsign() == 0){ // 세션 체크
        $scope.user = {
            authResponse: '',
            userID: '',
            name: '로그인을 해주세요!',
            email: '',
            picture : 'img/no-profile.jpg'
        }
    }else{
       $scope.user = UserService.getUser();
    } // localstorage의 sign값 0, 1로 구분함

    var fbLoginSuccess = function(response) { // 로그인 성공 함수
        if (!response.authResponse){
            fbLoginError("Cannot find the authResponse");
            return;
        }

        var authResponse = response.authResponse;

        getFacebookProfileInfo(authResponse)
        .then(function(profileInfo) {
            UserService.setUser({
                authResponse: authResponse,
                userID: profileInfo.id,
                name: profileInfo.name,
                email: profileInfo.email,
                picture : "http://graph.facebook.com/" + authResponse.userID + "/picture?type=large"
            }); // locatstorage의 facebook 유저 config에 정보를 세팅
            SignService.setsign(1); // 로그인 시에 localstorage의 sign 값 1로 세팅
            $scope.isLogin = 1;
            $scope.user = UserService.getUser(); // 세팅된 유저의 정보를 화면에 뿌려주기 위하여 가져옴
            $ionicLoading.hide();

            var url_appUser_insert = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/appUser_insert.php';
            if(!$scope.user.email){
                $scope.user.email = '';
            } // 로그인한 사용자의 email이 없을 시에 email 공백 세팅
            $http.get(url_appUser_insert+'?appUserID='+$scope.user.userID+'&email='+$scope.user.email+'&name='+$scope.user.name+'&type=0').then(function(resp){
                DBuserIdService.setDBid(resp.data);
                $cordovaToast.showLongBottom('로그인이 완료되었습니다.').then(function(success){}, function(error){});
            }); // 로그인한 유저를 DB에 INSERT 하는 $http 통신
        }, function(fail){});
    };

    var fbLoginError = function(error){ // 로그인 실패 함수
        $ionicLoading.hide();
    };

    var getFacebookProfileInfo = function (authResponse) {
        var info = $q.defer();
        facebookConnectPlugin.api('/me?fields=email,name&access_token=' + authResponse.accessToken, null,
            function (response) { info.resolve(response); },
            function (response) { info.reject(response); }
        );
        return info.promise;
    };

    $scope.facebookSignIn = function() {
        facebookConnectPlugin.getLoginStatus(function(success){
            if(success.status === 'connected'){
                var user = UserService.getUser('facebook');
                if(!user.userID){
                    getFacebookProfileInfo(success.authResponse).then(function(profileInfo) {
                        UserService.setUser({
                            authResponse: success.authResponse,
                            userID: profileInfo.id,
                            name: profileInfo.name,
                            email: profileInfo.email,
                            picture : "http://graph.facebook.com/" + success.authResponse.userID + "/picture?type=large"
                        });
                        SignService.setsign(1);
                        $scope.isLogin = 1;
                    }, function(fail){});
                }else{ $scope.user = UserService.getUser(); } // ???
            } else { // 일반적인 로그인 실행코드
                $ionicLoading.show({
                    template: '로그인 중...'
                });
                facebookConnectPlugin.login(['email', 'public_profile'], fbLoginSuccess, fbLoginError);
                $scope.user = UserService.getUser();
            }
        });
    };

    $scope.showLogOutMenu = function() {
        facebookConnectPlugin.logout(function(){
            UserService.setUser({
                authResponse: '',
                userID: '',
                name: '로그인을 해주세요!',
                email: '',
                picture : 'img/no-profile.jpg'
            });
            SignService.setsign(0);
            $scope.isLogin = 0;
            $scope.user = UserService.getUser();
            $state.go("tabsController.home");
            $cordovaToast.showLongBottom('로그아웃이 완료되었습니다.').then(function(success){}, function(error){});
        }, function(fail){ $ionicLoading.hide(); });
    };
    //////////////////////////////////////////////////////////////////////////////////////////////////

}])
   
.controller('homeCtrl', ['$scope', '$stateParams', '$state', '$ionicModal', '$http', 'SignService', 'UserService', 'DBuserIdService', 'PositionService', 
    '$cordovaGeolocation', '$ionicPopup', '$ionicLoading', 'geolocationStorage', '$timeout', '$ionicSlideBoxDelegate', '$cordovaToast', 
function ($scope, $stateParams, $state, $ionicModal, $http, SignService, UserService, DBuserIdService, PositionService, 
    $cordovaGeolocation, $ionicPopup, $ionicLoading, geolocationStorage, $timeout, $ionicSlideBoxDelegate, $cordovaToast) {

    // menu, back, sidemenu 태그 visible
    document.getElementById("MenuIcon").style.visibility = 'visible';
    document.getElementById("BackIcon").style.visibility = 'visible';
    document.getElementById("side-menu").style.visibility = 'visible';

    var url_datacount = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/datacount.php';
    $scope.inidData = null;

    // slide box를 위한 Delegate
    var AnnDelegate = $ionicSlideBoxDelegate.$getByHandle("AnnDelegate");
    var InfoDelegate = $ionicSlideBoxDelegate.$getByHandle("InfoDelegate");
    var AdvertDelegate = $ionicSlideBoxDelegate.$getByHandle("AdvertDelegate");

    var initialize = function(){
        $http.get(url_datacount).then(function(resp){
            $scope.initData = resp.data;
        }); // 등록된 PC방 수 / 광고 세팅

        $http.get('http://ec2-13-124-130-63.ap-northeast-2.compute.amazonaws.com/user').then(function(resp){
            console.log(resp.data);
        });
    };
    initialize();

    $scope.slideHasChanged = function(index) {
        $scope.slideIndex = index;
        if ( (AdvertDelegate.count() -1 ) == index ) {
            $timeout(function(){
                AdvertDelegate.slide(0);
            }, 3500);
        }
    }; // home 광고 slide 핸들러

    $scope.showSpinner = function() {
        $ionicLoading.show({
            template: '<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'
        });
    };
    $scope.hideSpinner = function(){
        $ionicLoading.hide();
    }; // 매우 간단한 loading spinner

    $scope.gotoScanner = function(){
        cordova.plugins.barcodeScanner.scan(
            function (result) {
                if(!result.cancelled){
                    alert("Result: " + result.text + "\nFormat: " + result.format);
                }else{
                    alert("Cancelled : " + result.cancelled);
                }
            },
            function (error) {
                alert("Error : " + error);
            }
        );
    };

    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 사용자 현위치
    var posOptions = { timeout: 30000, enableHighAccuracy: true };
    var myLatlng = null;

    var setGeocoder = function(latlng){
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({'latLng': latlng}, function(results, status) {
            if(status == google.maps.GeocoderStatus.OK) {
                $timeout(function(){ 
                    $scope.gpsLoc = (results[0].formatted_address).substring(5);

                    // 유저의 현위치 세팅 성공 시에 lat, lng, geolocation을 local에 저장하고 session을 1로 변경
                    PositionService.setPosition(latlng.lat(), latlng.lng(), $scope.gpsLoc, 1);
                    $scope.hideSpinner();
                }, 500);
            };
        });
    }; // GeoCoder

    $scope.gpsCall = function(){
        $scope.showSpinner();
        if (window.cordova) {
            $timeout(function(){
                cordova.plugins.diagnostic.isLocationEnabled(function(enabled) {
                    if(enabled){
                        $cordovaGeolocation.getCurrentPosition(posOptions).then (function (position){
                            myLatlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                            geolocationStorage.saveLatLng(position.coords.latitude, position.coords.longitude);
                            setGeocoder(myLatlng);
                        }, function (err) {});
                    }else{
                        cordova.plugins.diagnostic.switchToLocationSettings();
                        $scope.hideSpinner();
                    }
                }, function(error) {
                    alert("The following error occurred: " + error);
                });
            }, 2000);
        }else{
            // ionic serve browser
            myLatlng = new google.maps.LatLng(37.484802, 126.951610);
            geolocationStorage.saveLatLng(37.484802, 126.951610);
            setGeocoder(myLatlng);
        }
    };

    if(PositionService.getPosition().session == 1){
        $scope.gpsLoc = PositionService.getPosition().geoloc;
        myLatlng = new google.maps.LatLng(PositionService.getPosition().lat, PositionService.getPosition().lng);
    }else{
        $scope.gpsLoc = "내 위치 설정하기";
        $scope.gpsCall();
    }
    //////////////////////////////////////////////////////////////////////////////////////////////////////////

    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 제보 / 가맹문의 modal
    $scope.activeAnn = 0;
    $scope.slideChangedAnn = function(index) {
        $scope.activeAnn = index;
        AnnDelegate.slide(index);
    };

    $scope.fields = {};
    $scope.checkboxes = {};
    $scope.initAnnData = function(){
        $scope.fields = {
            pc_name: "",
            address: "",
            description: "",
            phonenumber: ""
        };

        $scope.checkboxes = {
            foodType: false, autokeyboardType: false, creditcardType: false, dualmonitorType: false, androidusbType: false,
            iphoneusbType: false, wordType: false, printerType: false, smokeareaType: false, atmType: false, tvplayType: false,
            giftcardType: false, wifiType: false, steamType: false, parkingType: false, coupleType: false
        };
    };

    $scope.showmodalann = function(){
        if(SignService.getsign() === 0){
            alert('로그인이 필요한 기능입니다.');
        }else{
            $ionicModal.fromTemplateUrl('templates/modal-announce.html', {
                scope: $scope,
                animation: 'slide-in-right',
            }).then(function(modal) {
                $scope.modalannounce = modal;
                $scope.initAnnData();
                $scope.modalannounce.show();
            });
        }
    };

    $scope.hidemodalann = function(){
        $scope.modalannounce.remove();
    };

    $scope.Annsubmit = function(){
        var url_ann = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/announce.php';
        url_ann = url_ann+'?app_user_id='+DBuserIdService.getDBid()+'&pc_name='+$scope.fields.pc_name+'&address='+$scope.fields.address+'&description='+$scope.fields.description
            +'&phonenumber='+$scope.fields.phonenumber+'&foodType='+$scope.checkboxes.foodType+'&autokeyboardType='+$scope.checkboxes.autokeyboardType
            +'&creditcardType='+$scope.checkboxes.creditcardType+'&dualmonitorType='+$scope.checkboxes.dualmonitorType
            +'&androidusbType='+$scope.checkboxes.androidusbType+'&iphoneusbType='+$scope.checkboxes.iphoneusbType
            +'&wordType='+$scope.checkboxes.wordType+'&printerType='+$scope.checkboxes.printerType+'&smokeareaType='+
            $scope.checkboxes.smokeareaType+'&atmType='+$scope.checkboxes.atmType+'&tvplayType='+$scope.checkboxes.tvplayType
            +'&giftcardType='+$scope.checkboxes.giftcardType+'&wifiType='+$scope.checkboxes.wifiType+'&steamType='+
            $scope.checkboxes.steamType+'&parkingType='+$scope.checkboxes.parkingType+'&coupleType='+$scope.checkboxes.coupleType;
        $http.get(url_ann).then(function(resp){
            $scope.hidemodalann();
            $scope.initAnnData();
            alert("소중한 제보 감사드립니다.");
        });
    };
    //////////////////////////////////////////////////////////////////////////////////////////////////////////

    /////////////////////////////////////////////////////////////////////////////
    // modal-info
    $scope.showmodalinfo = function(pcroom_id){
        $scope.showSpinner();
        $ionicModal.fromTemplateUrl('templates/modal-info.html', {
            scope: $scope,
            animation: 'slide-in-up',
        }).then(function(modal) {
            $scope.modalinfo = modal;
            if(PositionService.getPosition().session === 1){
                var url_info = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/';
                $http.get(url_info+'detailinfo.php?pcroom_id='+pcroom_id+'&geoLat='+myLatlng.lat()+
                    '&geoLng='+myLatlng.lng()+'&app_user_id='+DBuserIdService.getDBid()).then(function(resp){
                    $scope.pc = '';
                    $scope.pc = resp.data;
                    if($scope.pc.isfav === 1){
                        $scope.isfav = true;
                        $scope.favColor = 'favorite';
                    }else{
                        $scope.isfav = false;
                        $scope.favColor = null;
                    }
                    $scope.initAnnpcData();
                    $scope.activeInfo = 0;
                    InfoDelegate.slide(0);
                    $timeout(function(){
                        $scope.modalinfo.show();
                        $scope.hideSpinner();
                    }, 500);
                });
            }else{
                alert("화면 상단 \"내 위치 설정하기\" 를 눌러주세요.");
            }
        });
    };

    $scope.favColor = null;
    $scope.isfav = false;
    $scope.favorite = function(){
        if(SignService.getsign() === 0){
            alert('PC방 즐겨찾기를 하려면 먼저 로그인을 해주세요.')
        }else{
            $scope.isfav = !$scope.isfav;
            if($scope.isfav){
                $scope.favColor = 'favorite';
                var url_fav_insert = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/fav_insert.php';
                $http.get(url_fav_insert+'?app_user_id='+DBuserIdService.getDBid()+
                    '&pcroom_id='+$scope.pc.pcroom_id).then(function(resp){
                        $cordovaToast.showLongBottom('\''+$scope.pc.pc_name+'\' 즐겨찾기 추가 완료!').then(function(success){}, function(error){});
                });
            }else{
                $scope.favColor = '';
                var url_fav_delete = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/fav_delete.php';
                $http.get(url_fav_delete+'?app_user_id='+DBuserIdService.getDBid()+
                    '&pcroom_id='+$scope.pc.pcroom_id).then(function(resp){
                        $cordovaToast.showLongBottom('\''+$scope.pc.pc_name+'\' 즐겨찾기 삭제 완료!').then(function(success){}, function(error){});
                });
            }
        }
    };

    $scope.hidemodalinfo = function(){
        $scope.pc = '';
        $scope.modalinfo.remove();
    };

    $scope.slideChangedInfo = function(index) {
        $scope.activeInfo = index;
        InfoDelegate.slide(index);
    };
    /////////////////////////////////////////////////////////////////////////////
    
    /////////////////////////////////////////////////////////////////////////////
    // PC방 정보 수정
    $scope.showmodalannpc = function(){
        if(SignService.getsign() === 0){
            alert('로그인이 필요한 기능입니다.');
        }else{
            $ionicModal.fromTemplateUrl('templates/modal-annpc.html', {
                scope: $scope,
                animation: 'slide-in-right',
            }).then(function(modal) {
                $scope.modalannpc = modal;
                $scope.initAnnpcData();
                $scope.modalannpc.show();
            });
        }
    };

    $scope.hidemodalannpc = function(){
        $scope.modalannpc.remove();
    };

    $scope.initAnnpcData = function(){
        $scope.fields = {
            pc_name: $scope.pc.pc_name,
            address: $scope.pc.address,
            description: "",
            phonenumber: ""
        };

        $scope.checkboxes = {
            foodType: checkType($scope.pc.food), autokeyboardType: checkType($scope.pc.autokeyboard), creditcardType: checkType($scope.pc.creditcard), 
            dualmonitorType: checkType($scope.pc.dualmonitor), androidusbType: checkType($scope.pc.androidusb), iphoneusbType: checkType($scope.pc.iphoneusb), 
            wordType: checkType($scope.pc.word), printerType: checkType($scope.pc.printer), smokeareaType: checkType($scope.pc.smokearea), 
            atmType: checkType($scope.pc.atm), tvplayType: checkType($scope.pc.tvplay), giftcardType: checkType($scope.pc.giftcard), wifiType: checkType($scope.pc.wifi), 
            steamType: checkType($scope.pc.steam), parkingType: checkType($scope.pc.parking), coupleType: checkType($scope.pc.couple)
        };
    };

    var checkType = function(index){
        if(index == 1){
            return true;
        }else{
            return false;
        }
    };

    $scope.submit = function(){
        var url_ann = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/announce.php';
        url_ann = url_ann+'?app_user_id='+DBuserIdService.getDBid()+'&pcroom_id='+$scope.pc.pcroom_id+'&pc_name='+$scope.fields.pc_name+'&address='+$scope.fields.address+'&description='+$scope.fields.description
            +'&phonenumber='+$scope.fields.phonenumber+'&foodType='+$scope.checkboxes.foodType+'&autokeyboardType='+$scope.checkboxes.autokeyboardType
            +'&creditcardType='+$scope.checkboxes.creditcardType+'&dualmonitorType='+$scope.checkboxes.dualmonitorType
            +'&androidusbType='+$scope.checkboxes.androidusbType+'&iphoneusbType='+$scope.checkboxes.iphoneusbType
            +'&wordType='+$scope.checkboxes.wordType+'&printerType='+$scope.checkboxes.printerType+'&smokeareaType='+
            $scope.checkboxes.smokeareaType+'&atmType='+$scope.checkboxes.atmType+'&tvplayType='+$scope.checkboxes.tvplayType
            +'&giftcardType='+$scope.checkboxes.giftcardType+'&wifiType='+$scope.checkboxes.wifiType+'&steamType='+
            $scope.checkboxes.steamType+'&parkingType='+$scope.checkboxes.parkingType+'&coupleType='+$scope.checkboxes.coupleType;
        $http.get(url_ann).then(function(resp){
            $scope.hidemodalannpc();
            $scope.initAnnpcData();
            alert("소중한 제보 감사드립니다.");
        });
    };
    /////////////////////////////////////////////////////////////////////////////

    /////////////////////////////////////////////////////////////////////////////
    // modal-maps
    var mapInfo = null;
    $scope.mapInfo = null;
    var marker = null;
    var myMarker = null;
    var geocoderInfo = null;
    var pcLatlng = null;

    $scope.showmodalmaps = function(){
        $scope.showSpinner();
        $ionicModal.fromTemplateUrl('templates/modal-maps.html', {
            scope: $scope,
            animation: 'slide-in-right',
        }).then(function(modal) {
            $scope.modalmaps = modal;
            geocoderInfo = new google.maps.Geocoder();
            pcLatlng = new google.maps.LatLng($scope.pc.lat, $scope.pc.lng);
            myLatlng = new google.maps.LatLng(PositionService.getPosition().lat, PositionService.getPosition().lng);
            geocoderInfo.geocode({'latLng': pcLatlng}, function(results, status) {
                if(status == google.maps.GeocoderStatus.OK) {
                    $scope.pcLoc = (results[0].formatted_address).substring(5);
                };
            });
            $timeout(function(){
                initMapInfo();
                $scope.modalmaps.show();
            }, 200);
        });
    };

    $scope.hidemodalmaps = function(){
        $scope.modalmaps.remove();
        mapInfo = null;
        $scope.mapInfo = null;
    };

    $scope.pcLocation = function(){
        mapInfo.setCenter(pcLatlng)
    };

    $scope.myLocation = function(){
        mapInfo.setCenter(myLatlng);
    };

    var initMapInfo = function(){
        $timeout(function(){ // cache false 일 때 google maps 로딩이 잘 돌아게 함
            var mapOptions = {
                center: pcLatlng,
                zoom: 17,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                mapTypeControl: true,
                streetViewControl: true,
                zoomControl: true
            };

            mapInfo = new google.maps.Map(document.getElementById("mapInfo"), mapOptions);
            $scope.mapInfo = mapInfo;
            var im = 'img/info-location4.png';
            marker = new google.maps.Marker({
                position: pcLatlng,
                map: mapInfo,
                icon: im
            });

            var gpsm = 'img/gps.png';
            myMarker = new google.maps.Marker({
                position: myLatlng,
                map: mapInfo,
                icon: gpsm
            });
            $scope.hideSpinner();
        }, 500);
    };
    /////////////////////////////////////////////////////////////////////////////

    /////////////////////////////////////////////////////////////////////////////
    // modal-review
    $scope.review = {
        content: ''
    };
    $scope.rvs = [];

    $scope.showmodalreview = function(){
        $scope.showSpinner();
        $ionicModal.fromTemplateUrl('templates/modal-review.html', {
            scope: $scope,
            animation: 'slide-in-right',
        }).then(function(modal) {
            $scope.review.content = '';
            $scope.modalreview = modal;
            $scope.rvs = [];
            var url_review_select = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/review_select.php';
            $http.get(url_review_select+'?pcroom_id='+$scope.pc.pcroom_id).then(function(resp){
                $scope.rvs = resp.data;
                $timeout(function(){
                    $scope.modalreview.show();
                    $scope.hideSpinner();
                }, 200);
            });
        });
    };

    $scope.hidemodalreview = function(){
        $scope.modalreview.remove();
    };

    $scope.submitReview = function(){
        if(SignService.getsign() === 0){
            alert('로그인이 필요한 기능입니다.');
        }else{
            $scope.showSpinner();
            var url_review_insert = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/review_insert.php';
            $http.get(url_review_insert+'?app_user_id='+DBuserIdService.getDBid()+'&pcroom_id='+$scope.pc.pcroom_id+
                '&content='+$scope.review.content).then(function(resp){
                    alert('리뷰가 성공적으로 등록되었습니다.');
                    $scope.rvs = [];
                    $timeout(function(){
                        var url_review_select = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/review_select.php';
                        $http.get(url_review_select+'?pcroom_id='+$scope.pc.pcroom_id).then(function(resp){
                            $scope.rvs = resp.data;
                            $scope.review.content = '';
                            $scope.hideSpinner();
                        });
                    }, 500);
            });
        }
    };
    /////////////////////////////////////////////////////////////////////////////

    $scope.showmodalnotice = function(){
        $ionicModal.fromTemplateUrl('templates/modal-notice.html', {
            scope: $scope,
            animation: 'slide-in-right',
        }).then(function(modal) {
            $scope.modalnotice = modal;
            $scope.modalnotice.show();
        });
    };

    $scope.hidemodalnotice = function(){
        $scope.modalnotice.remove();
    };
}])
   
.controller('searchCtrl', ['$scope', '$stateParams', '$state', '$timeout', '$http', '$ionicModal', 'PositionService', 'SignService', 
    '$ionicSlideBoxDelegate', '$cordovaGeolocation', '$ionicPopup', '$ionicLoading', 'geolocationStorage', '$cordovaToast', 
function ($scope, $stateParams, $state, $timeout, $http, $ionicModal, PositionService, SignService, 
    $ionicSlideBoxDelegate, $cordovaGeolocation, $ionicPopup, $ionicLoading, geolocationStorage, $cordovaToast) {

    document.getElementById("MenuIcon").style.visibility = 'visible';
    document.getElementById("BackIcon").style.visibility = 'visible';
    document.getElementById("side-menu").style.visibility = 'visible';

    $scope.LocSubSea = 0; // 1: location 3: search
    $scope.moreDataLoad = false; // infinite scroll boolean
    var page = 0; // paging for list
    $scope.pcs = []; // pc방 리스트 배열

    var LocDelegate = $ionicSlideBoxDelegate.$getByHandle("LocDelegate");

    $scope.pc = {
        imageThumb: "test.png"
    };

    $scope.activeLoc = 0;
    $scope.slideChangedLoc = function(index) {
        $scope.activeLoc = index;
        LocDelegate.slide(index);
    }; // 지역, 지하철, 테마 slide box 핸들러

    $scope.showSpinner = function() {
        $ionicLoading.show({
            template: '<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'
        });
    };
    $scope.hideSpinner = function(){
        $ionicLoading.hide();
    }; // 매우 간단한 loading spinner

    /////////////////////////////////////////////////////////////////////////////////////
    // 사용자 현위치
    var posOptions = { timeout: 30000, enableHighAccuracy: true };
    var myLatlng = null;
    
    var setGeocoder = function(latlng){
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({'latLng': latlng}, function(results, status) {
            if(status == google.maps.GeocoderStatus.OK) {
                $timeout(function(){ 
                    $scope.gpsLoc = (results[0].formatted_address).substring(5);
                    PositionService.setPosition(latlng.lat(), latlng.lng(), $scope.gpsLoc, 1);
                    $scope.hideSpinner();
                }, 500);
            };
        });
    };
    $scope.gpsCall = function(){
        $scope.showSpinner();
        if (window.cordova) {
            $timeout(function(){
                cordova.plugins.diagnostic.isLocationEnabled(function(enabled) {
                    if(enabled){
                        $cordovaGeolocation.getCurrentPosition(posOptions).then (function (position){
                            myLatlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                            geolocationStorage.saveLatLng(position.coords.latitude, position.coords.longitude);
                            setGeocoder(myLatlng);
                        }, function (err) {});
                    }else{
                        cordova.plugins.diagnostic.switchToLocationSettings();
                        $scope.hideSpinner();
                    }
                }, function(error) {
                    alert("The following error occurred: " + error);
                });
            }, 2000);
        }else{
            // ionic serve browser
            myLatlng = new google.maps.LatLng(37.484802, 126.951610);
            geolocationStorage.saveLatLng(37.484802, 126.951610);
            setGeocoder(myLatlng);
        }
    };

    if(PositionService.getPosition().session == 1){
        $scope.gpsLoc = PositionService.getPosition().geoloc;
        myLatlng = new google.maps.LatLng(PositionService.getPosition().lat, PositionService.getPosition().lng);
    }else{
        $scope.gpsLoc = "내 위치 설정하기";
        $scope.gpsCall();
    }
    /////////////////////////////////////////////////////////////////////////////////////

    /////////////////////////////////////////////////////////////////////////////////////
    function locationList(page, s2, s2Name){
        $scope.showSpinner();
        if(PositionService.getPosition().session === 1){

            page = 0;
            $ionicModal.fromTemplateUrl('templates/modal-list.html', {
                scope: $scope,
                animation: 'slide-in-right',
            }).then(function(modal) {
                $scope.modallist = modal;
            });

            $scope.step2 = s2;
            $scope.step2Name = s2Name;
            var url_locationlist = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/';
            $http.get(url_locationlist+'showlocationlist.php?city2code='+$scope.step2
                +'&geoLat='+myLatlng.lat()+'&geoLng='+myLatlng.lng()+'&page='+page)
                .then(function(resp){
                    if(resp.data != 'null'){
                        $scope.ModallistTitle = $scope.step1Name + ' ' + $scope.step2Name;
                        $scope.pcs = [];
                        page = 0;
                        $scope.pcs = resp.data;
                        $scope.moreDataLoad = true;
                        $timeout(function(){
                            $scope.modallist.show();
                            $scope.hideSpinner();
                        }, 500);
                    }else{
                        alert('해당 지역의 데이터를 수집중입니다.');
                        $scope.hideSpinner();
                    }
            });
        }else{
            alert("화면 상단의 \"내 위치 설정하기\" 를 눌러주세요.");
            $scope.hideSpinner();
        }
    } // 지역으로 찾기 함수

    function themeList(){
        $scope.showSpinner();
        if(PositionService.getPosition().session === 1){

            page = 0;
            $ionicModal.fromTemplateUrl('templates/modal-list.html', {
                scope: $scope,
                animation: 'slide-in-right',
            }).then(function(modal) {
                $scope.modallist = modal;
            });

            var url_themelist = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/showthemelist.php?reqDist='+$scope.reqDist
                +'&geoLat='+myLatlng.lat()+'&geoLng='+myLatlng.lng()+'&foodType='+$scope.foodType+'&autokeyboardType='+
                $scope.autokeyboardType+'&creditcardType='+$scope.creditcardType+'&dualmonitorType='+$scope.dualmonitorType
                +'&androidusbType='+$scope.androidusbType+'&iphoneusbType='+$scope.iphoneusbType+'&wordType='+$scope.wordType+
                '&printerType='+$scope.printerType+'&smokeareaType='+$scope.smokeareaType+'&atmType='+$scope.atmType+
                '&tvplayType='+$scope.tvplayType+'&giftcardType='+$scope.giftcardType+'&wifiType='+$scope.wifiType+'&steamType='+
                $scope.steamType+'&parkingType='+$scope.parkingType+'&coupleType='+$scope.coupleType;
            $http.get(url_themelist+'&page='+page)
                .then(function(resp){
                    if(resp.data != 'null'){
                        $scope.ModallistTitle = '검색 결과';
                        $scope.pcs = [];
                        page = 0;
                        $scope.pcs = resp.data;
                        $scope.moreDataLoad = true;
                        $timeout(function(){
                            $scope.modallist.show();
                            $scope.hideSpinner();
                        }, 500);
                    }else{
                        alert('검색 결과가 없습니다.');
                        $scope.hideSpinner();
                    }
            });
        }else{
            alert("상단을 클릭하여 자신의 위치를 설정해주세요.");
            $scope.hideSpinner();
        }
    } // 테마로 찾기 함수

    function loadPCS(callback) {
        page++;
        if($scope.LocSubSea === 1){
            var url_locationlist = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/';
            $http.get(url_locationlist+'showlocationlist.php?city2code='+$scope.step2
                +'&geoLat='+myLatlng.lat()+'&geoLng='+myLatlng.lng()+'&page='+page)
                .then(function(resp){
                    var pcs = [];
                    angular.forEach(resp.data, function(child){
                        pcs.push(child);
                    });
                    callback(pcs);
            });
        }else if($scope.LocSubSea === 2){

        }else if($scope.LocSubSea === 3){
            var url_themelist = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/showthemelist.php?reqDist='+$scope.reqDist
                +'&geoLat='+myLatlng.lat()+'&geoLng='+myLatlng.lng()+'&foodType='+$scope.foodType+'&autokeyboardType='+
                $scope.autokeyboardType+'&creditcardType='+$scope.creditcardType+'&dualmonitorType='+$scope.dualmonitorType
                +'&androidusbType='+$scope.androidusbType+'&iphoneusbType='+$scope.iphoneusbType+'&wordType='+$scope.wordType+
                '&printerType='+$scope.printerType+'&smokeareaType='+$scope.smokeareaType+'&atmType='+$scope.atmType+
                '&tvplayType='+$scope.tvplayType+'&giftcardType='+$scope.giftcardType+'&wifiType='+$scope.wifiType+'&steamType='+
                $scope.steamType+'&parkingType='+$scope.parkingType+'&coupleType='+$scope.coupleType;
            $http.get(url_themelist+'&page='+page)
                .then(function(resp){
                    var pcs = [];
                    angular.forEach(resp.data, function(child){
                        pcs.push(child);
                    });
                    callback(pcs);
            });
        }
    } // paging 콜백 함수

    $scope.infiniteSpinner = function(){
        $timeout(function(){ 
            loadPCS(function(oldPCS){
                if(oldPCS[0] == 'n'){
                    $scope.moreDataLoad = false;
                }else{
                    $scope.pcs = $scope.pcs.concat(oldPCS);
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                }
            });
        }, 200);
    }; // infinite scroll 이벤트 (timeout: 200)

    $scope.hidemodallist = function(){
        $scope.ModallistTitle = '';
        $scope.pcs = [];
        page = 0;
        $scope.LocSubSea = 0;
        $scope.modallist.remove();
    };
    
    /////////////////////////////////////////////////////////////////////////////////////
    // 지역별
   	$scope.step1Change = function(s1, s1Name){
        if($scope.step1 != s1){
            $scope.step1 = s1;
            $scope.step1Name = s1Name;
            $scope.step2 = '';
            $scope.step2Name = '';
            $scope.City2S = '';
            var url_city2 = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/';
            $http.get(url_city2+'showCity2.php?city1code='+$scope.step1).then(function(resp){
                $scope.City2S = resp.data;
            });
        }
        $scope.step3 = '';
        $scope.step3Name = '';
        $scope.City3S = '';
    };
    $scope.step2Change = function(page, s2, s2Name){
        $scope.LocSubSea = 1;
        locationList(page, s2, s2Name);
    };/////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////
    

    /////////////////////////////////////////////////////////////////////////////////////
    // PC방 테마
    $scope.reqDist = 6;
    $scope.foodType = 0; $scope.autokeyboardType = 0; $scope.creditcardType = 0; $scope.dualmonitorType = 0;
    $scope.androidusbType = 0; $scope.iphoneusbType = 0; $scope.wordType = 0; $scope.printerType = 0;
    $scope.smokeareaType = 0; $scope.atmType = 0; $scope.tvplayType = 0; $scope.giftcardType = 0;
    $scope.wifiType = 0; $scope.steamType = 0; $scope.parkingType = 0; $scope.coupleType = 0;

    $scope.getDist = function(reqDist){
        $scope.reqDist = reqDist;
    };

    $scope.foodTheme = function(){ if($scope.foodType === 0){$scope.foodType=1;}else{$scope.foodType=0;} };
    $scope.autokeyboardTheme = function(){if($scope.autokeyboardType === 0){$scope.autokeyboardType=1;}else{$scope.autokeyboardType=0;} };
    $scope.creditcardTheme = function(){ if($scope.creditcardType === 0){$scope.creditcardType=1;}else{$scope.creditcardType=0;} };
    $scope.dualmonitorTheme = function(){ if($scope.dualmonitorType === 0){$scope.dualmonitorType=1;}else{$scope.dualmonitorType=0;} };
    $scope.androidusbTheme = function(){ if($scope.androidusbType === 0){$scope.androidusbType=1;}else{$scope.androidusbType=0;} };
    $scope.iphoneusbTheme = function(){ if($scope.iphoneusbType === 0){$scope.iphoneusbType=1;}else{$scope.iphoneusbType=0;} };
    $scope.wordTheme = function(){ if($scope.wordType === 0){$scope.wordType=1;}else{$scope.wordType=0;}; };
    $scope.printerTheme = function(){ if($scope.printerType === 0){$scope.printerType=1;}else{$scope.printerType=0;} };
    $scope.smokeareaTheme = function(){ if($scope.smokeareaType === 0){$scope.smokeareaType=1;}else{$scope.smokeareaType=0;} };
    $scope.atmTheme = function(){ if($scope.atmType === 0){$scope.atmType=1;}else{$scope.atmType=0;} };
    $scope.tvplayTheme = function(){ if($scope.tvplayType === 0){$scope.tvplayType=1;}else{$scope.tvplayType=0;} };
    $scope.giftcardTheme = function(){ if($scope.giftcardType === 0){$scope.giftcardType=1;}else{$scope.giftcardType=0;} };
    $scope.wifiTheme = function(){ if($scope.wifiType === 0){$scope.wifiType=1;}else{$scope.wifiType=0;} };
    $scope.steamTheme = function(){ if($scope.steamType === 0){$scope.steamType=1;}else{$scope.steamType=0;} };
    $scope.parkingTheme = function(){ if($scope.parkingType === 0){$scope.parkingType=1;}else{$scope.parkingType=0;} };
    $scope.coupleTheme = function(){ if($scope.coupleType === 0){$scope.coupleType=1;}else{$scope.coupleType=0;} };

    $scope.submitSearch = function(){
        $scope.LocSubSea = 3;
        themeList();
    };
    /////////////////////////////////////////////////////////////////////////////////////
}])
   
.controller('mapsCtrl', ['$scope', '$stateParams', '$timeout', '$cordovaGeolocation', 'SignService', 'DBuserIdService', '$rootScope', '$ionicActionSheet', 
    '$ionicPopup', '$ionicModal', '$http', '$ionicSlideBoxDelegate', '$ionicLoading', 'geolocationStorage', 'PositionService', '$cordovaToast', 
function ($scope, $stateParams, $timeout, $cordovaGeolocation, SignService, DBuserIdService, $rootScope, $ionicActionSheet, 
    $ionicPopup, $ionicModal, $http, $ionicSlideBoxDelegate, $ionicLoading, geolocationStorage, PositionService, $cordovaToast) {

    document.getElementById("MenuIcon").style.visibility = 'hidden';
    document.getElementById("BackIcon").style.visibility = 'hidden';
    document.getElementById("side-menu").style.visibility = 'hidden';

    var InfoDelegate = $ionicSlideBoxDelegate.$getByHandle("InfoDelegate");
    var markers = [];
    var cameraPosition = null;

    $scope.pc = {
        pcroom_id: '-',
        imgid: '-',
        imageMain: '---.png'
    };
    
    var userLatLng = {
        lat: null,
        lng: null
    }; // native google maps 에서 사용자의 위치를 받는 변수

    $scope.loading_show = function(){
        $ionicLoading.show({
            template: '<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>지도 불러오는 중 ...</p>'
        }).then(function(){});
    };
    $scope.loading_hide = function(){
        $ionicLoading.hide().then(function(){});
    }; // 지도 loading spinner

    $scope.showSpinner = function() {
        $ionicLoading.show({
            template: '<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'
        });
    };
    $scope.hideSpinner = function(){
        $ionicLoading.hide();
    }; // 매우 간단한 loading spinner

    $scope.showSpinnerInfo = function() {
        $ionicLoading.show({
            template: '<ion-spinner icon="lines" class="spinner-calm" style="float:left;"></ion-spinner>'
        });
    };
    $scope.hideSpinnerInfo = function(){
        $ionicLoading.hide();
    };

    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 사용자 현위치
    var posOptions = { timeout: 30000, enableHighAccuracy: true };
    var myLatlng = null;

    var setGeocoder = function(latlng){
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({'latLng': latlng}, function(results, status) {
            if(status == google.maps.GeocoderStatus.OK) {
                $timeout(function(){
                    $scope.gpsLoc = (results[0].formatted_address).substring(5);
                    PositionService.setPosition(latlng.lat(), latlng.lng(), $scope.gpsLoc, 1);
                    $timeout(function(){ initMap(); }, 1000);
                }, 500);
            };
        });
    };

    $scope.gpsCall = function(){
        $scope.loading_show();
        $timeout(function(){
            cordova.plugins.diagnostic.isLocationEnabled(function(enabled) {
                if(enabled){
                    $cordovaGeolocation.getCurrentPosition(posOptions).then (function (position){
                        myLatlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                        geolocationStorage.saveLatLng(position.coords.latitude, position.coords.longitude);
                        setGeocoder(myLatlng);
                    }, function (err) {});
                }else{
                    cordova.plugins.diagnostic.switchToLocationSettings();
                    myLatlng = new google.maps.LatLng(geolocationStorage.getLat(), geolocationStorage.getLng());
                    setGeocoder(myLatlng);
                }
            }, function(error) {
                alert("The following error occurred: " + error);
            });
        }, 2000);
    };

    if(PositionService.getPosition().session == 1){
        $scope.loading_show();
        $scope.gpsLoc = PositionService.getPosition().geoloc;
        myLatlng = new google.maps.LatLng(PositionService.getPosition().lat, PositionService.getPosition().lng);
        $timeout(function(){ initMap(); }, 1000);
    }else{
        $scope.gpsLoc = "내 위치 설정하기";
        $scope.gpsCall();
    }
    //////////////////////////////////////////////////////////////////////////////////////////////////////////

    var initMap = function(){
        var div = document.getElementById("map_canvas");
        var mapLatlng = new plugin.google.maps.LatLng(myLatlng.lat(), myLatlng.lng());
        var map = plugin.google.maps.Map.getMap(div, {
            'mapType': plugin.google.maps.MapTypeId.ROADMAP,
            'controls':{
                'compass': false,
                'myLocationButton': true,
                'indoorPicker': false,
                'zoom': true
            },
            'gestures': {
                'scroll': true,
                'tilt': false,
                'rotate': false,
                'zoom': true
            },
            'camera':{
                'latLng': mapLatlng,
                'zoom': 16
            }
        });

        map.one(plugin.google.maps.event.MAP_READY, function() {
            $scope.loading_hide();
            cameraPosition = map.getCameraPosition();
            replaceMarker(map, cameraPosition.target.lat, cameraPosition.target.lng);
            map.getMyLocation(onSuccess, onError);

            map.on(plugin.google.maps.event.MAP_DRAG_END, function() {
                map.clear();
                cameraPosition = map.getCameraPosition();
                $timeout(function(){ replaceMarker(map, cameraPosition.target.lat, cameraPosition.target.lng); }, 200);
            });

            map.on(plugin.google.maps.event.MY_LOCATION_BUTTON_CLICK, function() {
                map.getMyLocation(onSuccess, onError);
                $timeout(function(){ setgpsLoc(userLatLng.lat, userLatLng.lng); }, 1000);
            });
        });

        function replaceMarker(map, lat, lng){
            var data = [];
            var url_latlng = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/getmarkerNativeMaps.php';
            $http.get(url_latlng+'?geoLat='+myLatlng.lat()+'&geoLng='+myLatlng.lng()+'&camLat='+lat+'&camLng='+lng).then(function(resp){
                angular.forEach(resp.data, function(child){
                    map.addMarker({
                        position: {
                            lat: child.lat,
                            lng: child.lng
                        },
                        pcroom_id: child.pcroom_id,
                        title: child.pc_name,
                        dist: child.dist,
                        address: child.address,
                        imgid: child.imgid,
                        imageMain: child.imageMain
                    }, function(marker){
                        marker.on(plugin.google.maps.event.MARKER_CLICK, function() {
                            $scope.showSpinnerInfo();
                            $timeout(function(){
                                $scope.pc.pc_name = marker.get("title");
                                $scope.pc.pcroom_id = marker.get("pcroom_id");
                                $scope.pc.dist = marker.get("dist");
                                $scope.pc.address = marker.get("address");
                                $scope.pc.imageMain = marker.get("imageMain");
                                $scope.pc.imgid = marker.get("imgid");
                                $scope.hideSpinnerInfo();
                            }, 500);
                        });
                    });
                });
            });
        }

        var onSuccess = function(location) {
            userLatLng.lat = location.latLng.lat;
            userLatLng.lng = location.latLng.lng;
        };
        var onError = function(msg) {
            //alert(JSON.stringify(msg));
        };

        function setgpsLoc(lat, lng){
            var gpsLatLng = new google.maps.LatLng(lat, lng);
            var geocoder = new google.maps.Geocoder();
            geocoder.geocode({'latLng': gpsLatLng}, function(results, status) {
                if(status == google.maps.GeocoderStatus.OK) {
                    $timeout(function(){ 
                        $scope.gpsLoc = (results[0].formatted_address).substring(5);
                        PositionService.setPosition(latlng.lat(), latlng.lng(), $scope.gpsLoc, 1);
                    }, 500);
                };
            });
        }
    }; // native google maps
    /////////////////////////////////////////////////////////////////////////////

    /////////////////////////////////////////////////////////////////////////////
    // modal info
    $scope.showmodalinfo = function(pcroom_id){
        if(pcroom_id == '-'){
            alert("PC방을 선택해주세요!");
        }else{
            $ionicModal.fromTemplateUrl('templates/modal-info.html', {
                scope: $scope,
                animation: 'slide-in-left',
            }).then(function(modal) {
                $scope.modalinfo = modal;
                $scope.showSpinner();
                var url_info = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/';
                $http.get(url_info+'detailinfo.php?pcroom_id='+pcroom_id+'&geoLat='+userLatLng.lat+'&geoLng='
                    +userLatLng.lng+'&app_user_id='+DBuserIdService.getDBid()).then(function(resp){
                    $scope.pc = '';
                    $scope.pc = resp.data;
                    if($scope.pc.isfav === 1){
                        $scope.isfav = true;
                        $scope.favColor = 'favorite';
                    }else{
                        $scope.isfav = false;
                        $scope.favColor = null;
                    }
                    $scope.initAnnpcData();
                    $scope.activeInfo = 0;
                    InfoDelegate.slide(0);
                    $timeout(function(){
                        $scope.modalinfo.show();
                        $scope.hideSpinner();
                    }, 500);
                });
            });
        }
    };
    
    $scope.favColor = null;
    $scope.isfav = false;
    $scope.favorite = function(){
        if(SignService.getsign() === 0){
            alert('PC방 즐겨찾기를 하려면 먼저 로그인을 해주세요.')
        }else{
            $scope.isfav = !$scope.isfav;
            if($scope.isfav){
                $scope.favColor = 'favorite';
                var url_fav_insert = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/fav_insert.php';
                $http.get(url_fav_insert+'?app_user_id='+DBuserIdService.getDBid()+
                    '&pcroom_id='+$scope.pc.pcroom_id).then(function(resp){
                        $cordovaToast.showLongBottom('\''+$scope.pc.pc_name+'\' 즐겨찾기 추가 완료!').then(function(success){}, function(error){});
                });
            }else{
                $scope.favColor = '';
                var url_fav_delete = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/fav_delete.php';
                $http.get(url_fav_delete+'?app_user_id='+DBuserIdService.getDBid()+
                    '&pcroom_id='+$scope.pc.pcroom_id).then(function(resp){
                        $cordovaToast.showLongBottom('\''+$scope.pc.pc_name+'\' 즐겨찾기 삭제 완료!').then(function(success){}, function(error){});
                });
            }
        }
    };

    $scope.hidemodalinfo = function(){
        $scope.modalinfo.remove();
    };

    $scope.slideChangedInfo = function(index) {
        $scope.activeInfo = index;
        InfoDelegate.slide(index);
    };
    /////////////////////////////////////////////////////////////////////////////
    
    /////////////////////////////////////////////////////////////////////////////
    // modal-annpc
    $scope.showmodalannpc = function(){
        if(SignService.getsign() === 0){
            alert('로그인이 필요한 기능입니다.');
        }else{
            $ionicModal.fromTemplateUrl('templates/modal-annpc.html', {
                scope: $scope,
                animation: 'slide-in-right',
            }).then(function(modal) {
                $scope.modalannpc = modal;
                $scope.initAnnpcData();
                $scope.modalannpc.show();
            });
        }
    };

    $scope.hidemodalannpc = function(){
        $scope.modalannpc.remove();
    };

    $scope.initAnnpcData = function(){
        $scope.fields = {
            pc_name: $scope.pc.pc_name,
            address: $scope.pc.address,
            description: "",
            phonenumber: ""
        };

        $scope.checkboxes = {
            foodType: checkType($scope.pc.food), autokeyboardType: checkType($scope.pc.autokeyboard), creditcardType: checkType($scope.pc.creditcard), 
            dualmonitorType: checkType($scope.pc.dualmonitor), androidusbType: checkType($scope.pc.androidusb), iphoneusbType: checkType($scope.pc.iphoneusb), 
            wordType: checkType($scope.pc.word), printerType: checkType($scope.pc.printer), smokeareaType: checkType($scope.pc.smokearea), 
            atmType: checkType($scope.pc.atm), tvplayType: checkType($scope.pc.tvplay), giftcardType: checkType($scope.pc.giftcard), wifiType: checkType($scope.pc.wifi), 
            steamType: checkType($scope.pc.steam), parkingType: checkType($scope.pc.parking), coupleType: checkType($scope.pc.couple)
        };
    };

    var checkType = function(index){
        if(index == 1){
            return true;
        }else{
            return false;
        }
    };

    $scope.submit = function(){
        var url_ann = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/announce.php';
        url_ann = url_ann+'?app_user_id='+DBuserIdService.getDBid()+'&pcroom_id='+$scope.pc.pcroom_id+'&pc_name='+$scope.fields.pc_name+'&address='+$scope.fields.address+'&description='+$scope.fields.description
            +'&phonenumber='+$scope.fields.phonenumber+'&foodType='+$scope.checkboxes.foodType+'&autokeyboardType='+$scope.checkboxes.autokeyboardType
            +'&creditcardType='+$scope.checkboxes.creditcardType+'&dualmonitorType='+$scope.checkboxes.dualmonitorType
            +'&androidusbType='+$scope.checkboxes.androidusbType+'&iphoneusbType='+$scope.checkboxes.iphoneusbType
            +'&wordType='+$scope.checkboxes.wordType+'&printerType='+$scope.checkboxes.printerType+'&smokeareaType='+
            $scope.checkboxes.smokeareaType+'&atmType='+$scope.checkboxes.atmType+'&tvplayType='+$scope.checkboxes.tvplayType
            +'&giftcardType='+$scope.checkboxes.giftcardType+'&wifiType='+$scope.checkboxes.wifiType+'&steamType='+
            $scope.checkboxes.steamType+'&parkingType='+$scope.checkboxes.parkingType+'&coupleType='+$scope.checkboxes.coupleType;
        $http.get(url_ann).then(function(resp){
            $scope.hidemodalannpc();
            $scope.initAnnpcData();
            alert("소중한 제보 감사드립니다.");
        });
    };
    /////////////////////////////////////////////////////////////////////////////

    /////////////////////////////////////////////////////////////////////////////
    // modal-maps
    var mapInfo = null;
    $scope.mapInfo = null;
    var marker = null;
    var myMarker = null;
    var geocoderInfo = null;
    var pcLatlng = null;

    $scope.showmodalmaps = function(){
        $scope.showSpinner();
        $ionicModal.fromTemplateUrl('templates/modal-maps.html', {
            scope: $scope,
            animation: 'slide-in-right',
        }).then(function(modal) {
            $scope.modalmaps = modal;
            geocoderInfo = new google.maps.Geocoder();
            pcLatlng = new google.maps.LatLng($scope.pc.lat, $scope.pc.lng);
            myLatlng = new google.maps.LatLng(PositionService.getPosition().lat, PositionService.getPosition().lng);
            geocoderInfo.geocode({'latLng': pcLatlng}, function(results, status) {
                if(status == google.maps.GeocoderStatus.OK) {
                    $scope.pcLoc = (results[0].formatted_address).substring(5);
                };
            });
            $timeout(function(){
                initMapInfo();
                $scope.modalmaps.show();
            }, 200);
        });
    };

    $scope.hidemodalmaps = function(){
        $scope.modalmaps.remove();
        mapInfo = null;
        $scope.mapInfo = null;
    };

    $scope.pcLocation = function(){
        mapInfo.setCenter(pcLatlng)
    };

    $scope.myLocation = function(){
        mapInfo.setCenter(myLatlng);
    };

    var initMapInfo = function(){
        $timeout(function(){ // cache false 일 때 google maps 로딩이 잘 돌아게 함
            var mapOptions = {
                center: pcLatlng,
                zoom: 17,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                mapTypeControl: true,
                streetViewControl: true,
                zoomControl: true
            };

            mapInfo = new google.maps.Map(document.getElementById("mapInfo"), mapOptions);
            $scope.mapInfo = mapInfo;
            var im = 'img/info-location4.png';
            marker = new google.maps.Marker({
                position: pcLatlng,
                map: mapInfo,
                icon: im
            });

            var gpsm = 'img/gps.png';
            myMarker = new google.maps.Marker({
                position: myLatlng,
                map: mapInfo,
                icon: gpsm
            });
            $scope.hideSpinner();
        }, 500);
    };
    /////////////////////////////////////////////////////////////////////////////

    /////////////////////////////////////////////////////////////////////////////
    // modal-review
    $scope.review = {
        content: ''
    };
    $scope.rvs = [];

    $scope.showmodalreview = function(){
        $scope.showSpinner();
        $ionicModal.fromTemplateUrl('templates/modal-review.html', {
            scope: $scope,
            animation: 'slide-in-right',
        }).then(function(modal) {
            $scope.review.content = '';
            $scope.modalreview = modal;
            $scope.rvs = [];
            var url_review_select = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/review_select.php';
            $http.get(url_review_select+'?pcroom_id='+$scope.pc.pcroom_id).then(function(resp){
                $scope.rvs = resp.data;
                $timeout(function(){
                    $scope.modalreview.show();
                    $scope.hideSpinner();
                }, 200);
            });
        });
    };

    $scope.hidemodalreview = function(){
        $scope.modalreview.remove();
    };

    $scope.submitReview = function(){
        if(SignService.getsign() === 0){
            alert('로그인이 필요한 기능입니다.');
        }else{
            $scope.showSpinner();
            var url_review_insert = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/review_insert.php';
            $http.get(url_review_insert+'?app_user_id='+DBuserIdService.getDBid()+'&pcroom_id='+$scope.pc.pcroom_id+
                '&content='+$scope.review.content).then(function(resp){
                    alert('리뷰가 성공적으로 등록되었습니다.');
                    $scope.rvs = [];
                    $timeout(function(){
                        var url_review_select = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/review_select.php';
                        $http.get(url_review_select+'?pcroom_id='+$scope.pc.pcroom_id).then(function(resp){
                            $scope.rvs = resp.data;
                            $scope.review.content = '';
                            $scope.hideSpinner();
                        });
                    }, 500);
            });
        }
    };
    /////////////////////////////////////////////////////////////////////////////
    $scope.showmodalnotice = function(){
        $ionicModal.fromTemplateUrl('templates/modal-notice.html', {
            scope: $scope,
            animation: 'slide-in-right',
        }).then(function(modal) {
            $scope.modalnotice = modal;
            $scope.modalnotice.show();
        });
    };

    $scope.hidemodalnotice = function(){
        $scope.modalnotice.remove();
    };

}])
      
.controller('favoriteCtrl', ['$scope', '$stateParams', '$state', '$cordovaGeolocation', '$http', 'SignService', '$ionicModal', '$cordovaToast', 
    '$ionicPopup', '$timeout', '$ionicLoading', 'geolocationStorage', 'PositionService', 'DBuserIdService', '$ionicSlideBoxDelegate', 
function ($scope, $stateParams, $state, $cordovaGeolocation, $http, SignService, $ionicModal, $cordovaToast, 
    $ionicPopup, $timeout, $ionicLoading, geolocationStorage, PositionService, DBuserIdService, $ionicSlideBoxDelegate) {

    document.getElementById("MenuIcon").style.visibility = 'visible';
    document.getElementById("BackIcon").style.visibility = 'visible';
    document.getElementById("side-menu").style.visibility = 'visible';

    var InfoDelegate = $ionicSlideBoxDelegate.$getByHandle("InfoDelegate");
    $scope.pcs = [];

    $scope.showSpinner = function() {
        $ionicLoading.show({
            template: '<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'
        });
    };
    $scope.hideSpinner = function(){
        $ionicLoading.hide();
    }; // 매우 간단한 loading spinner

    /////////////////////////////////////////////////////////////////////////////
    // 사용자 현위치
    var posOptions = { timeout: 30000, enableHighAccuracy: true };
    var myLatlng = null;

    var setGeocoder = function(latlng){
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({'latLng': latlng}, function(results, status) {
            if(status == google.maps.GeocoderStatus.OK) {
                $timeout(function(){ 
                    $scope.gpsLoc = (results[0].formatted_address).substring(5);
                    PositionService.setPosition(latlng.lat(), latlng.lng(), $scope.gpsLoc, 1);
                    $scope.hideSpinner();
                }, 500);
            };
        });
    };

    $scope.gpsCall = function(){
        $scope.showSpinner();
        if (window.cordova) {
            $timeout(function(){
                cordova.plugins.diagnostic.isLocationEnabled(function(enabled) {
                    if(enabled){
                        $cordovaGeolocation.getCurrentPosition(posOptions).then (function (position){
                            myLatlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                            geolocationStorage.saveLatLng(position.coords.latitude, position.coords.longitude);
                            setGeocoder(myLatlng);
                        }, function (err) {});
                    }else{
                        cordova.plugins.diagnostic.switchToLocationSettings();
                        $scope.hideSpinner();
                    }
                }, function(error) {
                    alert("The following error occurred: " + error);
                });
            }, 2000);
        }else{
            // ionic serve browser
            myLatlng = new google.maps.LatLng(37.484802, 126.951610);
            geolocationStorage.saveLatLng(37.484802, 126.951610);
            setGeocoder(myLatlng);
        }
    };
    /////////////////////////////////////////////////////////////////////////////

    var getFavPCS = function(){
        var url_favpc = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/favpc.php?app_user_id='+DBuserIdService.getDBid();
        $http.get(url_favpc+'&geoLat='+geolocationStorage.getLat()+'&geoLng='+geolocationStorage.getLng()).then(function(resp){
            $scope.pcs = resp.data;
        });
    };

    if(SignService.getsign() == 0){
        alert('로그인이 필요한 기능입니다.');
        $state.go("tabsController.home");
    }else{
        if(PositionService.getPosition().session == 0){
            alert("화면 상단 \"내 위치 설정하기\" 를 눌러주세요.");
            $state.go("tabsController.home");
        }else{
            $scope.gpsLoc = PositionService.getPosition().geoloc;
            myLatlng = new google.maps.LatLng(PositionService.getPosition().lat, PositionService.getPosition().lng);
            getFavPCS();
        }
    }

    $scope.showmodalinfo = function(pcroom_id, dist){
        $ionicModal.fromTemplateUrl('templates/modal-info.html', {
            scope: $scope,
            animation: 'slide-in-up',
        }).then(function(modal) {
            $scope.modalinfo = modal;
            $scope.showSpinner();
            var url_info = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/';
            $http.get(url_info+'detailinfo.php?pcroom_id='+pcroom_id+'&geoLat=0&geoLng=0'
                +'&app_user_id='+DBuserIdService.getDBid()).then(function(resp){
                $scope.pc = '';
                $scope.pc = resp.data;
                if($scope.pc.isfav === 1){
                    $scope.isfav = true;
                    $scope.favColor = 'favorite';
                }else{
                    $scope.isfav = false;
                    $scope.favColor = null;
                }
                $scope.pc.dist = dist;
                $scope.initAnnpcData();
                $scope.activeInfo = 0;
                InfoDelegate.slide(0);
                $timeout(function(){
                    $scope.modalinfo.show();
                    $scope.hideSpinner();
                }, 500);
            });
        });
    };

    $scope.favColor = null;
    $scope.isfav = false;
    $scope.favorite = function(){
        if(SignService.getsign() == 0){
            alert('PC방 즐겨찾기를 하려면 먼저 로그인을 해주세요.')
        }else{
            $scope.isfav = !$scope.isfav;
            if($scope.isfav){
                $scope.favColor = 'favorite';
                var url_fav_insert = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/fav_insert.php';
                $http.get(url_fav_insert+'?app_user_id='+DBuserIdService.getDBid()+
                    '&pcroom_id='+$scope.pc.pcroom_id).then(function(resp){
                        $cordovaToast.showLongBottom('\''+$scope.pc.pc_name+'\' 즐겨찾기 추가 완료!').then(function(success){}, function(error){});
                        $timeout(function(){ getFavPCS();}, 500);
                });
            }else{
                $scope.favColor = '';
                var url_fav_delete = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/fav_delete.php';
                $http.get(url_fav_delete+'?app_user_id='+DBuserIdService.getDBid()+
                    '&pcroom_id='+$scope.pc.pcroom_id).then(function(resp){
                        $cordovaToast.showLongBottom('\''+$scope.pc.pc_name+'\' 즐겨찾기 삭제 완료!').then(function(success){}, function(error){});
                        $timeout(function(){ getFavPCS();}, 500);
                });
            }
        }
    };

    $scope.hidemodalinfo = function(){
        $scope.pc = '';
        $scope.modalinfo.remove();
    };

    $scope.slideChangedInfo = function(index) {
        $scope.activeInfo = index;
        InfoDelegate.slide(index);
    };

    /////////////////////////////////////////////////////////////////////////////
    // PC방 정보 수정
    $scope.showmodalannpc = function(){
        if(SignService.getsign() == 0){
            alert('로그인이 필요한 기능입니다.');
        }else{
            $ionicModal.fromTemplateUrl('templates/modal-annpc.html', {
                scope: $scope,
                animation: 'slide-in-right',
            }).then(function(modal) {
                $scope.modalannpc = modal;
                $scope.initAnnpcData();
                $scope.modalannpc.show();
            });
        }
    };

    $scope.hidemodalannpc = function(){
        $scope.modalannpc.remove();
    };

    $scope.initAnnpcData = function(){
        $scope.fields = {
            pc_name: $scope.pc.pc_name,
            address: $scope.pc.address,
            description: "",
            phonenumber: ""
        };

        $scope.checkboxes = {
            foodType: checkType($scope.pc.food), autokeyboardType: checkType($scope.pc.autokeyboard), creditcardType: checkType($scope.pc.creditcard), 
            dualmonitorType: checkType($scope.pc.dualmonitor), androidusbType: checkType($scope.pc.androidusb), iphoneusbType: checkType($scope.pc.iphoneusb), 
            wordType: checkType($scope.pc.word), printerType: checkType($scope.pc.printer), smokeareaType: checkType($scope.pc.smokearea), 
            atmType: checkType($scope.pc.atm), tvplayType: checkType($scope.pc.tvplay), giftcardType: checkType($scope.pc.giftcard), wifiType: checkType($scope.pc.wifi), 
            steamType: checkType($scope.pc.steam), parkingType: checkType($scope.pc.parking), coupleType: checkType($scope.pc.couple)
        };
    };

    var checkType = function(index){
        if(index == 1){
            return true;
        }else{
            return false;
        }
    };

    $scope.submit = function(){
        var url_ann = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/announce.php';
        url_ann = url_ann+'?app_user_id='+DBuserIdService.getDBid()+'&pcroom_id='+$scope.pc.pcroom_id+'&pc_name='+$scope.fields.pc_name+'&address='+$scope.fields.address+'&description='+$scope.fields.description
            +'&phonenumber='+$scope.fields.phonenumber+'&foodType='+$scope.checkboxes.foodType+'&autokeyboardType='+$scope.checkboxes.autokeyboardType
            +'&creditcardType='+$scope.checkboxes.creditcardType+'&dualmonitorType='+$scope.checkboxes.dualmonitorType
            +'&androidusbType='+$scope.checkboxes.androidusbType+'&iphoneusbType='+$scope.checkboxes.iphoneusbType
            +'&wordType='+$scope.checkboxes.wordType+'&printerType='+$scope.checkboxes.printerType+'&smokeareaType='+
            $scope.checkboxes.smokeareaType+'&atmType='+$scope.checkboxes.atmType+'&tvplayType='+$scope.checkboxes.tvplayType
            +'&giftcardType='+$scope.checkboxes.giftcardType+'&wifiType='+$scope.checkboxes.wifiType+'&steamType='+
            $scope.checkboxes.steamType+'&parkingType='+$scope.checkboxes.parkingType+'&coupleType='+$scope.checkboxes.coupleType;
        $http.get(url_ann).then(function(resp){
            $scope.hidemodalannpc();
            $scope.initAnnpcData();
            alert("소중한 제보 감사드립니다.");
        });
    };
    /////////////////////////////////////////////////////////////////////////////

    /////////////////////////////////////////////////////////////////////////////
    // modal-maps
    var mapInfo = null;
    $scope.mapInfo = null;
    var marker = null;
    var myMarker = null;
    var geocoderInfo = null;
    var pcLatlng = null;

    $scope.showmodalmaps = function(){
        $scope.showSpinner();
        $ionicModal.fromTemplateUrl('templates/modal-maps.html', {
            scope: $scope,
            animation: 'slide-in-right',
        }).then(function(modal) {
            $scope.modalmaps = modal;
            geocoderInfo = new google.maps.Geocoder();
            pcLatlng = new google.maps.LatLng($scope.pc.lat, $scope.pc.lng);
            myLatlng = new google.maps.LatLng(PositionService.getPosition().lat, PositionService.getPosition().lng);
            geocoderInfo.geocode({'latLng': pcLatlng}, function(results, status) {
                if(status == google.maps.GeocoderStatus.OK) {
                    $scope.pcLoc = (results[0].formatted_address).substring(5);
                };
            });
            $timeout(function(){
                initMapInfo();
                $scope.modalmaps.show();
            }, 200);
        });
    };

    $scope.hidemodalmaps = function(){
        $scope.modalmaps.remove();
        mapInfo = null;
        $scope.mapInfo = null;
    };

    $scope.pcLocation = function(){
        mapInfo.setCenter(pcLatlng)
    };

    $scope.myLocation = function(){
        mapInfo.setCenter(myLatlng);
    };

    var initMapInfo = function(){
        $timeout(function(){ // cache false 일 때 google maps 로딩이 잘 돌아게 함
            var mapOptions = {
                center: pcLatlng,
                zoom: 17,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                mapTypeControl: true,
                streetViewControl: true,
                zoomControl: true
            };

            mapInfo = new google.maps.Map(document.getElementById("mapInfo"), mapOptions);
            $scope.mapInfo = mapInfo;
            var im = 'img/info-location4.png';
            marker = new google.maps.Marker({
                position: pcLatlng,
                map: mapInfo,
                icon: im
            });

            var gpsm = 'img/gps.png';
            myMarker = new google.maps.Marker({
                position: myLatlng,
                map: mapInfo,
                icon: gpsm
            });
            $scope.hideSpinner();
        }, 500);
    };
    ///////////////////////////////////////////////////////////////////////////

    /////////////////////////////////////////////////////////////////////////////
    // modal-review
    $scope.review = {
        content: ''
    };
    $scope.rvs = [];

    $scope.showmodalreview = function(){
        $scope.showSpinner();
        $ionicModal.fromTemplateUrl('templates/modal-review.html', {
            scope: $scope,
            animation: 'slide-in-right',
        }).then(function(modal) {
            $scope.review.content = '';
            $scope.modalreview = modal;
            $scope.rvs = [];
            var url_review_select = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/review_select.php';
            $http.get(url_review_select+'?pcroom_id='+$scope.pc.pcroom_id).then(function(resp){
                $scope.rvs = resp.data;
                $timeout(function(){
                    $scope.modalreview.show();
                    $scope.hideSpinner();
                }, 200);
            });
        });
    };

    $scope.hidemodalreview = function(){
        $scope.modalreview.remove();
    };

    $scope.submitReview = function(){
        if(SignService.getsign() === 0){
            alert('로그인이 필요한 기능입니다.');
        }else{
            $scope.showSpinner();
            var url_review_insert = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/review_insert.php';
            $http.get(url_review_insert+'?app_user_id='+DBuserIdService.getDBid()+'&pcroom_id='+$scope.pc.pcroom_id+
                '&content='+$scope.review.content).then(function(resp){
                    alert('리뷰가 성공적으로 등록되었습니다.');
                    $scope.rvs = [];
                    $timeout(function(){
                        var url_review_select = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/review_select.php';
                        $http.get(url_review_select+'?pcroom_id='+$scope.pc.pcroom_id).then(function(resp){
                            $scope.rvs = resp.data;
                            $scope.review.content = '';
                            $scope.hideSpinner();
                        });
                    }, 500);
            });
        }
    };
    /////////////////////////////////////////////////////////////////////////////

    $scope.showmodalnotice = function(){
        $ionicModal.fromTemplateUrl('templates/modal-notice.html', {
            scope: $scope,
            animation: 'slide-in-right',
        }).then(function(modal) {
            $scope.modalnotice = modal;
            $scope.modalnotice.show();
        });
    };

    $scope.hidemodalnotice = function(){
        $scope.modalnotice.remove();
    };

    /////////////////////////////////////////////////////////////////////////////

}])

.controller('ModalListCtrl', ['$scope', '$ionicModal', '$http', '$ionicSlideBoxDelegate', '$cordovaToast', 
    '$timeout', '$ionicLoading', 'SignService', 'DBuserIdService', 'PositionService', 
function ($scope, $ionicModal, $http, $ionicSlideBoxDelegate, $cordovaToast, 
    $timeout, $ionicLoading, SignService, DBuserIdService, PositionService) {

    $scope.pc = null;
    $scope.fields = {};

    var InfoDelegate = $ionicSlideBoxDelegate.$getByHandle("InfoDelegate");

    $scope.showSpinner = function() {
        $ionicLoading.show({
            template: '<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'
        });
    };

    $scope.hideSpinner = function(){
        $ionicLoading.hide();
    };

    $scope.slideChangedInfo = function(index) {
        $scope.activeInfo = index;
        InfoDelegate.slide(index);
    };

    $scope.showmodalinfo = function(pcroom_id, dist){
        $ionicModal.fromTemplateUrl('templates/modal-info.html', {
            scope: $scope,
            animation: 'slide-in-up',
        }).then(function(modal) {
            $scope.modalinfo = modal;
            $scope.showSpinner();
            var url_info = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/';
            $http.get(url_info+'detailinfo.php?pcroom_id='+pcroom_id+'&geoLat=0&geoLng=0'
                +'&app_user_id='+DBuserIdService.getDBid()).then(function(resp){
                $scope.pc = '';
                $scope.pc = resp.data;
                if($scope.pc.isfav === 1){
                    $scope.isfav = true;
                    $scope.favColor = 'favorite';
                }else{
                    $scope.isfav = false;
                    $scope.favColor = null;
                }
                $scope.pc.dist = dist;
                $scope.initAnnpcData();
                $scope.activeInfo = 0;
                InfoDelegate.slide(0);
                $timeout(function(){
                    $scope.modalinfo.show();
                    $scope.hideSpinner();
                }, 500);
            });
        });
    };

    $scope.favColor = '';
    $scope.isfav = false;
    $scope.favorite = function(){
        if(SignService.getsign() == 0){
            alert('PC방 즐겨찾기를 하려면 먼저 로그인을 해주세요.')
        }else{
            $scope.isfav = !$scope.isfav;
            if($scope.isfav){
                $scope.favColor = 'favorite';
                var url_fav_insert = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/fav_insert.php';
                $http.get(url_fav_insert+'?app_user_id='+DBuserIdService.getDBid()+
                    '&pcroom_id='+$scope.pc.pcroom_id).then(function(resp){
                        $cordovaToast.showLongBottom('\''+$scope.pc.pc_name+'\' 즐겨찾기 추가 완료!').then(function(success){}, function(error){});
                });
            }else{
                $scope.favColor = '';
                var url_fav_delete = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/fav_delete.php';
                $http.get(url_fav_delete+'?app_user_id='+DBuserIdService.getDBid()+
                    '&pcroom_id='+$scope.pc.pcroom_id).then(function(resp){
                        $cordovaToast.showLongBottom('\''+$scope.pc.pc_name+'\' 즐겨찾기 삭제 완료!').then(function(success){}, function(error){});
                });
            }
        }
    };

    $scope.hidemodalinfo = function(){
        $scope.pc = '';
        $scope.modalinfo.remove();
    };
    /////////////////////////////////////////////////////////////////////////////

    /////////////////////////////////////////////////////////////////////////////
    // modal-annpc
    $scope.showmodalannpc = function(){
        if(SignService.getsign() == 0){
            alert('로그인이 필요한 기능입니다.');
        }else{
            $ionicModal.fromTemplateUrl('templates/modal-annpc.html', {
                scope: $scope,
                animation: 'slide-in-right',
            }).then(function(modal) {
                $scope.modalannpc = modal;
                $scope.initAnnpcData();
                $scope.modalannpc.show();
            });
        }
    };

    $scope.hidemodalannpc = function(){
        $scope.modalannpc.remove();
    };

    $scope.initAnnpcData = function(){
        $scope.fields = {
            pc_name: $scope.pc.pc_name,
            address: $scope.pc.address,
            description: "",
            phonenumber: ""
        };

        $scope.checkboxes = {
            foodType: checkType($scope.pc.food), autokeyboardType: checkType($scope.pc.autokeyboard), creditcardType: checkType($scope.pc.creditcard), 
            dualmonitorType: checkType($scope.pc.dualmonitor), androidusbType: checkType($scope.pc.androidusb), iphoneusbType: checkType($scope.pc.iphoneusb), 
            wordType: checkType($scope.pc.word), printerType: checkType($scope.pc.printer), smokeareaType: checkType($scope.pc.smokearea), 
            atmType: checkType($scope.pc.atm), tvplayType: checkType($scope.pc.tvplay), giftcardType: checkType($scope.pc.giftcard), wifiType: checkType($scope.pc.wifi), 
            steamType: checkType($scope.pc.steam), parkingType: checkType($scope.pc.parking), coupleType: checkType($scope.pc.couple)
        };
    };

    var checkType = function(index){
        if(index == 1){
            return true;
        }else{
            return false;
        }
    };

    $scope.submit = function(){
        var url_ann = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/announce.php';
        url_ann = url_ann+'?app_user_id='+DBuserIdService.getDBid()+'&pcroom_id='+$scope.pc.pcroom_id+'&pc_name='+$scope.fields.pc_name+'&address='+$scope.fields.address+'&description='+$scope.fields.description
            +'&phonenumber='+$scope.fields.phonenumber+'&foodType='+$scope.checkboxes.foodType+'&autokeyboardType='+$scope.checkboxes.autokeyboardType
            +'&creditcardType='+$scope.checkboxes.creditcardType+'&dualmonitorType='+$scope.checkboxes.dualmonitorType
            +'&androidusbType='+$scope.checkboxes.androidusbType+'&iphoneusbType='+$scope.checkboxes.iphoneusbType
            +'&wordType='+$scope.checkboxes.wordType+'&printerType='+$scope.checkboxes.printerType+'&smokeareaType='+
            $scope.checkboxes.smokeareaType+'&atmType='+$scope.checkboxes.atmType+'&tvplayType='+$scope.checkboxes.tvplayType
            +'&giftcardType='+$scope.checkboxes.giftcardType+'&wifiType='+$scope.checkboxes.wifiType+'&steamType='+
            $scope.checkboxes.steamType+'&parkingType='+$scope.checkboxes.parkingType+'&coupleType='+$scope.checkboxes.coupleType;
        $http.get(url_ann).then(function(resp){
            $scope.hidemodalannpc();
            $scope.initAnnpcData();
            alert("소중한 제보 감사드립니다.");
        });
    };///////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////

    /////////////////////////////////////////////////////////////////////////////
    // modal-maps
    var mapInfo = null;
    $scope.mapInfo = null;
    var marker = null;
    var myMarker = null;
    var geocoderInfo = null;
    var pcLatlng = null;

    $scope.showmodalmaps = function(){
        $scope.showSpinner();
        $ionicModal.fromTemplateUrl('templates/modal-maps.html', {
            scope: $scope,
            animation: 'slide-in-right',
        }).then(function(modal) {
            $scope.modalmaps = modal;
            geocoderInfo = new google.maps.Geocoder();
            pcLatlng = new google.maps.LatLng($scope.pc.lat, $scope.pc.lng);
            myLatlng = new google.maps.LatLng(PositionService.getPosition().lat, PositionService.getPosition().lng);
            geocoderInfo.geocode({'latLng': pcLatlng}, function(results, status) {
                if(status == google.maps.GeocoderStatus.OK) {
                    $scope.pcLoc = (results[0].formatted_address).substring(5);
                };
            });
            $timeout(function(){
                initMapInfo();
                $scope.modalmaps.show();
            }, 200);
        });
    };

    $scope.hidemodalmaps = function(){
        $scope.modalmaps.remove();
        mapInfo = null;
        $scope.mapInfo = null;
    };

    $scope.pcLocation = function(){
        mapInfo.setCenter(pcLatlng)
    };

    $scope.myLocation = function(){
        mapInfo.setCenter(myLatlng);
    };

    var initMapInfo = function(){
        $timeout(function(){ // cache false 일 때 google maps 로딩이 잘 돌아게 함
            var mapOptions = {
                center: pcLatlng,
                zoom: 17,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                mapTypeControl: true,
                streetViewControl: true,
                zoomControl: true
            };

            mapInfo = new google.maps.Map(document.getElementById("mapInfo"), mapOptions);
            $scope.mapInfo = mapInfo;
            var im = 'img/info-location4.png';
            marker = new google.maps.Marker({
                position: pcLatlng,
                map: mapInfo,
                icon: im
            });

            var gpsm = 'img/gps.png';
            myMarker = new google.maps.Marker({
                position: myLatlng,
                map: mapInfo,
                icon: gpsm
            });
            $scope.hideSpinner();
        }, 500);
    };
    /////////////////////////////////////////////////////////////////////////////

    /////////////////////////////////////////////////////////////////////////////
    // modal-review
    $scope.review = {
        content: ''
    };
    $scope.rvs = [];

    $scope.showmodalreview = function(){
        $scope.showSpinner();
        $ionicModal.fromTemplateUrl('templates/modal-review.html', {
            scope: $scope,
            animation: 'slide-in-right',
        }).then(function(modal) {
            $scope.review.content = '';
            $scope.modalreview = modal;
            $scope.rvs = [];
            var url_review_select = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/review_select.php';
            $http.get(url_review_select+'?pcroom_id='+$scope.pc.pcroom_id).then(function(resp){
                $scope.rvs = resp.data;
                $timeout(function(){
                    $scope.modalreview.show();
                    $scope.hideSpinner();
                }, 200);
            });
        });
    };

    $scope.hidemodalreview = function(){
        $scope.modalreview.remove();
    };

    $scope.submitReview = function(){
        if(SignService.getsign() === 0){
            alert('로그인이 필요한 기능입니다.');
        }else{
            $scope.showSpinner();
            var url_review_insert = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/review_insert.php';
            $http.get(url_review_insert+'?app_user_id='+DBuserIdService.getDBid()+'&pcroom_id='+$scope.pc.pcroom_id+
                '&content='+$scope.review.content).then(function(resp){
                    alert('리뷰가 성공적으로 등록되었습니다.');
                    $scope.rvs = [];
                    $timeout(function(){
                        var url_review_select = 'http://ec2-13-124-84-103.ap-northeast-2.compute.amazonaws.com/wepc/review_select.php';
                        $http.get(url_review_select+'?pcroom_id='+$scope.pc.pcroom_id).then(function(resp){
                            $scope.rvs = resp.data;
                            $scope.review.content = '';
                            $scope.hideSpinner();
                        });
                    }, 500);
            });
        }
    };
    /////////////////////////////////////////////////////////////////////////////

    $scope.showmodalnotice = function(){
        $ionicModal.fromTemplateUrl('templates/modal-notice.html', {
            scope: $scope,
            animation: 'slide-in-right',
        }).then(function(modal) {
            $scope.modalnotice = modal;
            $scope.modalnotice.show();
        });
    };

    $scope.hidemodalnotice = function(){
        $scope.modalnotice.remove();
    };

}])

.controller('gameboxCtrl', ['$scope', '$stateParams', 
    function ($scope, $stateParams) {

    document.getElementById("MenuIcon").style.visibility = 'visible';
    document.getElementById("BackIcon").style.visibility = 'visible';
    document.getElementById("side-menu").style.visibility = 'visible';
}])