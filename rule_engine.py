def rule_score(case_data, precedent_distances, keywords):
    score = 25.0

    c_type = case_data.get('case_type', '').lower()
    if "criminal" in c_type:
        score += 22.0
    elif "family" in c_type:
        score += 15.0

    summary_text = case_data.get('summary', '').lower()

    keyword_points = 0
    for word, points in keywords.items():
        if word in summary_text:
            keyword_points += points

    score += min(keyword_points, 32.0)

    if precedent_distances and len(precedent_distances[0]) > 0:
        if precedent_distances[0][0] < 0.9:
            score += 12.0

    return score
