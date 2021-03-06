﻿using AdobeScheduler.Models;
using AdobeScheduler.Security;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using AdobeConnectSDK;
using System.Web.Security;
using System;



namespace AdobeScheduler.Controllers
{
    public class AuthController : Controller
    {   
        
        [HandleError]
        [AllowAnonymous]
        [HttpPost]
        public ActionResult Login(LoginUser user)
        {
            if (ModelState.IsValid)
            {
                AdobeConnectXmlAPI con = new AdobeConnectXmlAPI();
                StatusInfo sInfo;
                if (con.Login(user.Username, user.Password, out sInfo))
                {
                    int id = int.Parse(con.GetUserInfo().user_id);
                    Identity Id = new Identity( id , user.Username, "T");
                    DateTime expire = DateTime.Now.AddMinutes(FormsAuthentication.Timeout.TotalMinutes);
                    FormsAuthenticationTicket ticket = new FormsAuthenticationTicket(Id.ID, user.Username, DateTime.Now, expire, false, Id.GetUserData());
                    string hashTicket = FormsAuthentication.Encrypt(ticket);
                    HttpCookie cookie = new HttpCookie(FormsAuthentication.FormsCookieName, hashTicket);
                    HttpContext.Response.Cookies.Add(cookie);
                    UserSession userSession = new UserSession(con.GetMyMeetings(), con.GetUserInfo());
                    using (AdobeConnectDB _db = new AdobeConnectDB()) {
                        var check = _db.AdobeUserInfo.Where(u => u.Username == user.Username).FirstOrDefault();
                        if (check == null)
                        {
                            var newlogin = new LoginUser(); 
                            newlogin.Username = user.Username;
                            newlogin.Password = user.Password; 
                            newlogin.Id = id;
                            _db.AdobeUserInfo.Add(newlogin);
                            _db.SaveChanges();
                        }
                        else
                        {
                            check = user;
                            _db.SaveChanges();
                        }
                       
                    }
                    Session["UserSession"] = userSession;
                }
                else {
                    return View("Login");
               }

                
            }

            return RedirectToAction("Index", "Dashboard");

        }

        [HttpGet]
        public ActionResult Login()
        {
            return View();
        }

        [Authorize]
        public ActionResult Logout()
        {
            FormsAuthentication.SignOut();
            Session.Abandon();
            HttpCookie cookie1 = new HttpCookie(FormsAuthentication.FormsCookieName, "");
            cookie1.Expires = DateTime.Now.AddYears(-1);
            Response.Cookies.Add(cookie1);
            return RedirectToAction("Index", "Dashboard");
        }

        public ActionResult UnAUthorized()
        {
            return View("Login"); 
        }

        
    }
}
