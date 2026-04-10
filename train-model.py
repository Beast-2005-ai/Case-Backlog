import os
import json
import joblib
import xgboost as xgb
from feature_engineering import extract_features
from rule_engine import rule_score

# Extract the keyword dictionary from your main judge script
from judge import URGENCY_KEYWORDS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "pending_cases_json")

X = []
y = []
print("Preparing training data...")
for root, _, files in os.walk(DATA_DIR):
    for file in files:
        if file.endswith(".json"):
            path = os.path.join(root, file)

            with open(path, "r", encoding="utf-8") as f:
                case = json.load(f)

            distances = [[0.5]] 

            features = extract_features(case, distances, URGENCY_KEYWORDS)
            score = rule_score(case, distances, URGENCY_KEYWORDS)

            X.append(features)
            y.append(score)
            
print("Training XGBoost Hybrid Model...")

model = xgb.XGBRegressor(n_estimators=100, max_depth=5)
model.fit(X, y)

model_path = os.path.join(BASE_DIR, "priority_model.pkl")
joblib.dump(model, model_path)
print("✅ Model saved at:", model_path)