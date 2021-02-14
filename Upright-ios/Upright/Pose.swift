//
//  ContentView.swift
//  Upright
//
//  Created by Daniel Edrisian on 2/13/21.
//

import SwiftUI
import Firebase
import FirebaseFirestore
import SwiftCharts

struct Pose: Identifiable {
  var id: String
  var date: Date
  var slouch: Double
  var confidence: Double
}


let testPoses: [Pose] = [
  Pose(id: UUID().uuidString,
       date: Date(timeIntervalSinceNow: -70),
       slouch: 0.5,
       confidence: 1.0),
  Pose(id: UUID().uuidString,
       date: Date(timeIntervalSinceNow: -50),
       slouch: 0.7,
       confidence: 1.0),
  Pose(id: UUID().uuidString,
       date: Date(timeIntervalSinceNow: -30),
       slouch: 0.6,
       confidence: 1.0),
  Pose(id: UUID().uuidString,
       date: Date(timeIntervalSinceNow: -10),
       slouch: 0.5,
       confidence: 1.0),
]
