def extract_features(case_data, precedent_distances, keyword_dict):
    text = case_data.get("summary", "").lower()

    features = []

    # 1. Case type
    features.append(1 if "criminal" in case_data.get("case_type", "").lower() else 0)
    features.append(1 if "family" in case_data.get("case_type", "").lower() else 0)

    # 2. Keyword score
    keyword_score = 0
    for word, points in keyword_dict.items():
        if word in text:
            keyword_score += points
    features.append(min(keyword_score, 32))

    # 3. Precedent similarity
    if precedent_distances and len(precedent_distances[0]) > 0:
        sim = 1 - precedent_distances[0][0]
    else:
        sim = 0
    features.append(sim)

    # 4. Text length
    features.append(len(text))

    return features
