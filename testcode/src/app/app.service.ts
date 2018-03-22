import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from "rxjs/Subscription";
import { Observable } from "rxjs/Observable";
import { Http, Response, Headers, RequestOptions, Request, RequestMethod } from '@angular/http';
import 'rxjs/Rx';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';

@Injectable()
export class AppService {
  constructor(
    private http: Http
  ) { };
  public tmp = 123;
  public selectedLoc: any = "";
  public locale = "";
  public selectedAst: number;
  public typeAstTable: string;
  //real data from link
  private appUrl = "https://esb.pouchen.com/dev/services/eam/inventory";

  post(url: string, json: any): Observable<any> {
    let headers = new Headers();
    headers.append('Content-Type', 'application/x-www-form-urlencoded');
    let options = new RequestOptions({ headers: headers });
    return this.http.post(url, JSON.stringify(json), { headers })
      .map(res => res.json())
      .catch(this.handleError);
  }
  private handleError(error: Response | any) {
    // In a real world app, you might use a remote logging infrastructure
    let errMsg: string;
    if (error instanceof Response) {
      const body = error.json() || '';
      const err = body.error || JSON.stringify(body);
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    console.error(errMsg);
    return Observable.throw(errMsg);
  }
}
