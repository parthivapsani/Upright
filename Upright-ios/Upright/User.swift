//
//  ContentView.swift
//  Upright
//
//  Created by Daniel Edrisian on 2/13/21.
//

import SwiftUI
import Firebase
import FirebaseFirestore

fileprivate let usersCollection = Firestore.firestore().collection("users")

class User: Identifiable, ObservableObject {
  static var current: User = User()
  
  @Published var id: String = ""
  @Published var email: String = ""
  @Published var firstName: String = ""
  @Published var lastName: String = ""
  @Published var poses: [Pose] = []
  
  init() {
    if let uid = Auth.auth().currentUser?.uid {
      id = uid
      firstName = UserDefaults.standard.string(forKey: "firstName") ?? ""
      lastName = UserDefaults.standard.string(forKey: "lastName") ?? ""
      self.getUserData { (error) in
        if let e = error {
          print(e)
        }
      }
    }
  }
  
  var isSignedIn: Bool {
    Auth.auth().currentUser?.uid != nil
  }
  
  func getUserData(completion: @escaping (Error?) -> ()) {
    if id == "" {
      completion(NSError())
      return
    }
    usersCollection.document(id).getDocument { (snap, error) in
      guard let data = snap?.data() else {
        completion(error)
        return
      }
      
      self.firstName = data["firstName"] as? String ?? ""
      self.lastName = data["lastName"] as? String ?? ""
      self.email = Auth.auth().currentUser?.email ?? ""
      UserDefaults.standard.set(self.firstName, forKey: "firstName")
      UserDefaults.standard.set(self.firstName, forKey: "lastName")
    
      usersCollection.document(self.id).collection("slouches").getDocuments { (snap, error) in
        guard let docs = snap?.documents else { return }
        self.poses = []
        for doc in docs {
          let data = doc.data()
          self.poses.append(Pose(id: UUID().uuidString,
                                 date: data["date"] as! Date,
                                 slouch: Double((data["slouch-percent"] as! Int))/100.0,
                                 confidence: data["slouch-condifence"] as! Double))
        }
      }
      
      completion(error)
    }
  }
  
  func signIn(email: String, password: String, completion: @escaping (Error?) -> ()) {
    Auth.auth().signIn(withEmail: email, password: password) { (user, error) in
      if let u = user {
        self.id = u.user.uid
        self.email = u.user.email ?? ""
      }
      self.getUserData { (error) in
        if let e = error {
          print(e)
        }
      }
      completion(error)
    }
  }
}
