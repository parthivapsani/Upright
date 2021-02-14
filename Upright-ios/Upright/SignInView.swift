//
//  ContentView.swift
//  Upright
//
//  Created by Daniel Edrisian on 2/13/21.
//

import SwiftUI
import Firebase

struct SignInView: View {
  @State var email: String = ""
  @State var password: String = ""
  @State var isSignedIn = false
  
  var body: some View {
    TextField("Email", text: $email)
      .keyboardType(.emailAddress)
      .textFieldStyle(RoundedBorderTextFieldStyle())
      .padding()
    SecureField("Password", text: $password)
      .textFieldStyle(RoundedBorderTextFieldStyle())
      .padding()
      .padding(.top, -30.0)
    Button(action: {
    }, label: {
      Text("Sign In")
    })
      .fullScreenCover(isPresented: $isSignedIn) {
      Text("Signed In")
    }
  }
  
  func signin() {
    User.current.signIn(email: email, password: password) { (error) in
      if let e = error {
        print(e)
        return
      }
      isSignedIn = true
    }
  }
}

struct SignInView_Previews: PreviewProvider {
  static var previews: some View {
    SignInView()
  }
}
