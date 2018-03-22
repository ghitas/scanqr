import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Http, Response, Headers, RequestOptions, Request, RequestMethod } from '@angular/http';
import { AppService } from "./app.service";
import { Injectable, OnInit } from '@angular/core';
import 'rxjs/Rx';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
@Injectable()
export class AppComponent implements OnInit {
  objectKeys = Object.keys;
  user = {};
  route: string;
  constructor(
    private http: Http,
    private service: AppService,
    // private router: Router,
    // private location: Location
  ) {
    // router.events.subscribe((val) => {
    //   if (location.path() != '') {
    //     this.route = location.path();
    //   } else {
    //     this.route = 'Home'
    //   }
    // });
  }
  ngOnInit(): void {
    this.route = window.location.href.split("?")[1];
    this.route = this.route.split("#")[0];
    var url = "https://accounts.google.com/o/oauth2/token?" + this.route + "&client_id=364602988528-7nbkl7eertpdfomppohbcrosdte8snln.apps.googleusercontent.com&client_secret=d7ziC-RIQqitrUa_D4kVaXL1&redirect_uri=http://localhost:8080/callback&grant_type=authorization_code";
    var params = this.route + "&client_id=364602988528-7nbkl7eertpdfomppohbcrosdte8snln.apps.googleusercontent.com&client_secret=d7ziC-RIQqitrUa_D4kVaXL1&redirect_uri=http://localhost:8080/callback&grant_type=authorization_code";
    console.log(url);
    var url = "https://accounts.google.com/o/oauth2/token";
    
    // this.service.post(url, {}).subscribe(
    //   result => console.log("teo"),
    //   error => console.log(error)
    // );

    // let headers = new Headers();
    // headers.append('Content-Type', 'application/x-www-form-urlencoded');
    // let options = new RequestOptions({ headers: headers });
    // this.http.post(url, {}, { headers })
    //   .subscribe(res => { console.log(res.json())});

    var http = new XMLHttpRequest();
    http.open("POST", url, true);
    http.withCredentials = true;
    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    http.onreadystatechange = function () {
      if (http.readyState == 4 && http.status == 200) {
        alert(http.responseText);
      }
    }
    http.send(params);
  }
  title = 'My First Angular App!';
}

