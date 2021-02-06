function Observable(forEach) {
  this._forEach = forEach;
}

Observable.prototype = {
  forEach: function (onNext, onError, onCompleted) {
    if (typeof arguments[0] === "function") {
      return this._forEach({
        onNext: onNext,
        onError: onError || function () {},
        onCompleted: onCompleted || function () {},
      });
    } else {
      return this._forEach(onNext);
    }
  },
  map: function (mapperFn) {
    var self = this;
    return new Observable(function forEach(observer) {
      return self.forEach(
        function onNext(x) {
          observer.onNext(mapperFn(x));
        },
        function onError(e) {
          observer.onError(e);
        },
        function onCompleted() {
          observer.onCompleted();
        }
      );
    });
  },
  filter: function (filterFn) {
    var self = this;
    return new Observable(function forEach(observer) {
      return self.forEach(
        function onNext(x) {
          if (filterFn(x)) {
            observer.onNext(x);
          }
        },
        function onError(e) {
          observer.onError(e);
        },
        function onCompleted() {
          observer.onCompleted();
        }
      );
    });
  },
  take: function (num) {
    var self = this;
    return new Observable(function forEach(observer) {
      var counter = 0;
      var subscription = self.forEach(
        function onNext(v) {
          observer.onNext(v);
          counter++;
          if (counter === num) {
            subscription.dispose();
            observer.onCompleted();
          }
        },
        function onError(e) {
          observer.onError(e);
        },
        function onCompleted() {
          observer.onCompleted();
        }
      );
      return subscription;
    });
  },
};

Observable.fromEvent = function (dom, eventName) {
  // make a new observable { _forEach: () => {} }
  return new Observable(function forEachClickEvent(observer) {
    var handler = (e) => observer.onNext(e);

    dom.addEventListener(eventName, handler);

    // Subscription
    return {
      dispose: () => {
        dom.removeEventListener(eventName, handler);
      },
    };
  });
};

var button = document.getElementById("button");
// clicks is an Observable, and clicks._forEach = forEachClickEvent
var clicks = Observable.fromEvent(button, "click")
  .map((e) => e.timeStamp)
  .take(3);
// when call forEach on clicks, set the observer as
// {
//   onNext: (x) => console.log(x),
//   onError: function () {},
//   onCompleted: function () {},
// }
// therefore, when handler been called, the observer.onNext(e) will be e => console.log(e)
clicks.forEach((e) => console.log(e));
