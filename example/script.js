// Code goes here
window.onload = function () {
  var Observable = Rx.Observable;
  var textbox = document.getElementById("textbox");
  var keypresses = Observable.fromEvent(textbox, "keypress");
  var results = document.getElementById("results");
  var searchButton = document.getElementById("searchButton");
  var searchButtonClicks = Observable.fromEvent(searchButton, "click");

  function getWikipediaSearchResults(term) {
    return Observable.create(function forEach(observer) {
      var cancelled = false;
      var url =
        "http://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=" +
        encodeURIComponent(term) +
        "&callback=?";
      $.getJSON(url, function (data) {
        if (!cancelled) {
          observer.onNext(data[1]);
          observer.onCompleted();
        }
      });

      return function dispose() {
        cancelled = true;
      };
    });
  }

  var searchFormOpens = searchButtonClicks.doAction(function onNext(v) {
    document.getElementById("searchForm").style.display = "block";
  });

  //[1,2,3].map(x => [x]) -> [[1],[2],[3]]

  var searchResultSets = searchFormOpens
    .map(function () {
      var closeClicks = Observable.fromEvent(
        document.getElementById("closeButton"),
        "click"
      );
      var searchFormCloses = closeClicks.doAction(
        function () {
          document.getElementById("searchForm").style.display = "none";
        },
        function (e) {},
        function () {}
      );

      return (
        keypresses
          // {.'a'..'b'.......'c'..'d'.....
          .throttle(20)
          // {...........'b'............'d'.....
          .map(function (key) {
            return textbox.value;
          })
          // {...........'ab'.....'ab'....'abc'..
          .distinctUntilChanged()
          // {...........'ab'.............'abc'
          .map(function (search) {
            return getWikipediaSearchResults(search).retry(3);
          })
          .switchLatest()
          .takeUntil(searchFormCloses)
      );
      // {........................................["abacus"]...
    })
    .switchLatest();

  searchResultSets.forEach(
    function (resultSet) {
      results.value = JSON.stringify(resultSet);
    },
    function (error) {
      alert("Not working. Try again later.");
    }
  );
};
