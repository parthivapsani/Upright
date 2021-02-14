//
//  UprightApp.swift
//  Upright
//
//  Created by Daniel Edrisian on 2/13/21.
//

import SwiftUI
import Firebase
import FirebaseFirestore

@main
struct UprightApp: App {
  @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
  
  var body: some Scene {
    WindowGroup {
      if User.current.isSignedIn {
        HomeView()
      } else {
        SignInView()
      }
    }
  }
}

class AppDelegate: NSObject, UIApplicationDelegate {
  func applicationDidFinishLaunching(_: UIApplication) {}
  
  func application(_ application: UIApplication, didFinishLaunchingWithOptions _: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
    FirebaseApp.configure()
    
    return true
  }
}
