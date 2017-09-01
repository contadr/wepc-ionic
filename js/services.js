angular.module('app.services', [])

.service('geolocationStorage', function($localStorage){
	if($localStorage.location == null){
		$localStorage.location = {
			lat: 37.484802,
			lng: 126.951610
		}
	}
	var ret = {
		getLat: function(){
			return $localStorage.location.lat;
		},
		getLng: function(){
			return $localStorage.location.lng;
		},
		saveLatLng: function(lat, lng){
			$localStorage.location.lat = lat;
			$localStorage.location.lng = lng;
		}
	}
	return ret;
}) // 유저의 마지막 현위치를 저장받는 service

.service('SignService', function($localStorage){
	if($localStorage.sign == null){
		$localStorage.sign = 0;
	}
	var ret = {
		getsign: function(){
			return $localStorage.sign;
		},
		setsign: function(si){
			$localStorage.sign = si;
		}
	}
	return ret;
}) // 유저가 로그인 중인지 아닌지를 local에서 판단하는 service

.service('DBuserIdService', function($localStorage){
	if($localStorage.DBid == null){
		$localStorage.DBid = '0';
	}
	var ret = {
		getDBid: function(){
			return $localStorage.DBid;
		},
		setDBid: function(dbid){
			$localStorage.DBid = dbid;
		}
	}
	return ret;
}) // 현재 로그인한 유저의 Primary ID 키를 local에 담는 service

.service('PositionService', function($localStorage){
	if($localStorage.position == null){
		$localStorage.position = {
			lat: '',
			lng: '',
			geoloc: '',
			session: 0
		}
	}
	var ret = {
		getPosition: function(){
			return $localStorage.position;
		},
		setPosition: function(lat, lng, geoloc, session){
			$localStorage.position.lat = lat;
			$localStorage.position.lng = lng;
			$localStorage.position.geoloc = geoloc;
			$localStorage.position.session = session;
		}
	}
	return ret;
})

.service('UserService', function() {
  // For the purpose of this example I will store user data on ionic local storage but you should save it on a database
  var setUser = function(user_data) {
    window.localStorage.starter_facebook_user = JSON.stringify(user_data);
  };

  var getUser = function(){
    return JSON.parse(window.localStorage.starter_facebook_user || '{}');
  };

  return {
    getUser: getUser,
    setUser: setUser
  };
}); // 페이스북으로 로그인 한 유저의 정보를 local에 담는 service