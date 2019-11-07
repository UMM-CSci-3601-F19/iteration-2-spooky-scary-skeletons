
import {Injectable, NgZone, OnInit} from "@angular/core";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs/Observable";
import {environment} from "../environments/environment";
import {CanActivate, Router} from "@angular/router";

//Declare pulls the variable from the html/js environment, so our gapi we declared in index gets pulled here.

declare let gapi: any;

//Basic descriptions about some of the objects we work with
//Gapi: The google api thing
//Auth2: Has to be initialized first (done in index.html), then contains a lot of useful things.
//gapi.auth2.getAuthInstance(). Type: gapi.auth2.GoogleAuth object. This is what is used to call most of the methods.
//authInstance.currentUser.get(). Type: GoogleUser. Gets all of the user's information as well as authenticating info.

//The google oauth bible (Where this information comes from) https://developers.google.com/identity/sign-in/web/reference
//Documentation written by students in a hopefully easier to apply form can be found in the documentation folder.

@Injectable()
export class AuthService implements CanActivate, OnInit{
  private http: HttpClient;
  private signedInFlag: boolean;

  constructor(private client: HttpClient, public router: Router) {
    this.http = client;
  }

  getUserName(): string {
    return gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getName();
  }

  getUserId(): string {
    return gapi.auth2.getAuthInstance().currentUser.get().getId();
  }

  getIdToken(): string {
    return gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  }

  setRedirect(): string {
    return gapi.auth2.SigninOptionsBuilder().setRedirect();
  }

  signIn() {
    let authInstance = gapi.auth2.getAuthInstance();
    authInstance.signIn()
      .then((data) => {
        let idtoken = data.getAuthResponse().id_token;
        const httpOptions = {
          headers: new HttpHeaders({
            'Content-Type': 'application/json'
          }),
          responseType: 'text' as 'json'
        };    //If the user doesn't log in (ie closes the dialog box), we think they're logged in right now.

        this.http.post<string>(environment.API_URL + 'login', {idtoken: idtoken}, httpOptions)
          .subscribe((data) => {
          });
        this.signedInFlag = true;
      });
  }


  signOut() {
    console.log("Signing out");
    let authInstance = gapi.auth2.getAuthInstance();
    authInstance.signOut();
    this.signedInFlag = false;
  }

  isSignedIn(): boolean {
    return this.signedInFlag;
  }

  canActivate(): boolean {
    if (!this.isSignedIn()) {
      this.router.navigate(['']);
      return false;
    }
    return true;
  }

  loadClient() {
    gapi.load('auth2', function() {
      gapi.auth2.init({
        'clientId': '423967606864-lvvgdu2iam9a15o5bnt53eglu8i0n1c4.apps.googleusercontent.com'
      });
    });
  }

  ngOnInit() {
  }
}
