import json
import re
from typing import Dict, Literal
from datetime import datetime

class TicketProcessor:
    """Automated customer support ticket resolution system"""

    def __init__(self):
        self.categories = ["billing", "technical", "account", "general"]
        self.sentiments = ["angry", "neutral", "positive"]
        self.priorities = ["low", "medium", "high", "critical"]
        self.statuses = ["resolved", "pending", "escalated"]

    def analyze_ticket(self, message: str, user_email: str = None) -> Dict:
        """Main entry point for ticket analysis"""
        category = self._detect_category(message)
        sentiment = self._detect_sentiment(message)
        priority = self._assign_priority(message, sentiment, category)

        response_data = self._generate_response(message, category, sentiment, priority)

        should_escalate = self._should_escalate(sentiment, priority, category, response_data['confidence'])

        status = "escalated" if should_escalate else response_data['status']
        next_action = self._determine_next_action(status, category, priority)

        return {
            "status": status,
            "priority": priority,
            "category": category,
            "sentiment": sentiment,
            "response": response_data['response'],
            "next_action": next_action,
            "confidence_score": response_data['confidence']
        }

    def _detect_category(self, message: str) -> str:
        """Detect issue category from message content"""
        message_lower = message.lower()

        billing_keywords = ['bill', 'charge', 'payment', 'invoice', 'refund', 'subscription', 'price', 'cost', 'fee']
        technical_keywords = ['error', 'bug', 'crash', 'not working', 'broken', 'issue', 'problem', 'login', 'access']
        account_keywords = ['account', 'password', 'username', 'profile', 'settings', 'email', 'phone']

        scores = {
            'billing': sum(1 for kw in billing_keywords if kw in message_lower),
            'technical': sum(1 for kw in technical_keywords if kw in message_lower),
            'account': sum(1 for kw in account_keywords if kw in message_lower)
        }

        max_score = max(scores.values())
        if max_score == 0:
            return "general"

        return max(scores, key=scores.get)

    def _detect_sentiment(self, message: str) -> str:
        """Detect sentiment from message tone"""
        message_lower = message.lower()

        angry_indicators = ['angry', 'furious', 'unacceptable', 'terrible', 'worst', 'horrible',
                           'disgusting', 'frustrated', 'ridiculous', 'pathetic', '!!!', 'scam']
        positive_indicators = ['thank', 'great', 'excellent', 'appreciate', 'love', 'perfect',
                              'wonderful', 'amazing', 'happy']

        angry_count = sum(1 for word in angry_indicators if word in message_lower)
        positive_count = sum(1 for word in positive_indicators if word in message_lower)

        if angry_count > positive_count and angry_count >= 1:
            return "angry"
        elif positive_count > angry_count and positive_count >= 1:
            return "positive"
        return "neutral"

    def _assign_priority(self, message: str, sentiment: str, category: str) -> str:
        """Assign priority level based on multiple factors"""
        message_lower = message.lower()

        critical_keywords = ['security', 'breach', 'hack', 'fraud', 'unauthorized', 'stolen', 'emergency']
        high_keywords = ['urgent', 'asap', 'immediately', 'critical', 'important', 'cannot access']

        if any(kw in message_lower for kw in critical_keywords):
            return "critical"

        if sentiment == "angry" and category in ["billing", "account"]:
            return "high"

        if any(kw in message_lower for kw in high_keywords):
            return "high"

        if category == "billing" or sentiment == "angry":
            return "medium"

        return "low"

    def _generate_response(self, message: str, category: str, sentiment: str, priority: str) -> Dict:
        """Generate appropriate response based on ticket analysis"""

        greeting = self._get_greeting(sentiment)
        body = self._get_response_body(message, category, sentiment, priority)
        closing = self._get_closing(sentiment)

        response = f"{greeting} {body} {closing}"

        word_count = len(response.split())
        if word_count > 150:
            response = ' '.join(response.split()[:145]) + "..."

        confidence = self._calculate_confidence(message, category)
        status = "resolved" if confidence > 0.7 and priority in ["low", "medium"] else "pending"

        return {
            'response': response,
            'confidence': confidence,
            'status': status
        }

    def _get_greeting(self, sentiment: str) -> str:
        """Get appropriate greeting based on sentiment"""
        if sentiment == "angry":
            return "We sincerely apologize for the inconvenience you've experienced."
        elif sentiment == "positive":
            return "Thank you for reaching out!"
        return "Thank you for contacting us."

    def _get_response_body(self, message: str, category: str, sentiment: str, priority: str) -> str:
        """Generate main response body"""
        message_lower = message.lower()

        if category == "billing":
            if "refund" in message_lower:
                return "I've reviewed your refund request. Our billing team will process this within 3-5 business days. You'll receive a confirmation email once completed."
            elif "charge" in message_lower or "payment" in message_lower:
                return "I've located your billing information. Please verify the charge details in your account dashboard. If you notice any discrepancies, our billing team will investigate immediately."
            return "I've forwarded your billing inquiry to our finance team. They'll review your account and respond within 24 hours with a detailed explanation."

        elif category == "technical":
            if "login" in message_lower or "access" in message_lower:
                return "I understand you're having trouble accessing your account. Please try clearing your browser cache and cookies, then attempt to log in again. If the issue persists, use the 'Forgot Password' option to reset your credentials."
            elif "error" in message_lower or "bug" in message_lower:
                return "Thank you for reporting this technical issue. Our engineering team has been notified and is investigating. We'll update you within 24-48 hours with a resolution or workaround."
            return "I've documented your technical issue and escalated it to our support engineers. They'll analyze the problem and contact you with a solution shortly."

        elif category == "account":
            if "password" in message_lower:
                return "To reset your password, click the 'Forgot Password' link on the login page. You'll receive a secure reset link via email within minutes. If you don't receive it, please check your spam folder."
            return "I've reviewed your account settings. To make the requested changes, please log into your account dashboard and navigate to Settings > Profile. If you need further assistance, our team is here to help."

        return "I've received your inquiry and our team is reviewing it carefully. We'll provide a detailed response within 24 hours. Your satisfaction is our priority."

    def _get_closing(self, sentiment: str) -> str:
        """Get appropriate closing based on sentiment"""
        if sentiment == "angry":
            return "We value your business and are committed to resolving this promptly."
        return "Please don't hesitate to reach out if you have any questions."

    def _calculate_confidence(self, message: str, category: str) -> float:
        """Calculate confidence score for the response"""
        if len(message.split()) < 5:
            return 0.4

        if category == "general":
            return 0.5

        message_lower = message.lower()
        specific_keywords = ['refund', 'login', 'password', 'charge', 'error', 'bug']

        if any(kw in message_lower for kw in specific_keywords):
            return 0.85

        return 0.65

    def _should_escalate(self, sentiment: str, priority: str, category: str, confidence: float) -> bool:
        """Determine if ticket should be escalated"""
        if sentiment == "angry" and priority in ["high", "critical"]:
            return True

        if category == "billing" and priority in ["high", "critical"]:
            return True

        if priority == "critical":
            return True

        if confidence < 0.6:
            return True

        return False

    def _determine_next_action(self, status: str, category: str, priority: str) -> str:
        """Determine next action based on ticket status"""
        if status == "escalated":
            return "Forward to senior support team for immediate review"
        elif status == "pending":
            return f"Await response from {category} team within 24-48 hours"
        return "Close ticket and send satisfaction survey"

    def process_and_format(self, message: str, user_email: str = None) -> str:
        """Process ticket and return formatted JSON"""
        result = self.analyze_ticket(message, user_email)
        return json.dumps(result, indent=2)


def main():
    """Example usage"""
    processor = TicketProcessor()

    test_tickets = [
        "I was charged twice for my subscription this month! This is unacceptable!!!",
        "Hi, I'm having trouble logging into my account. Can you help?",
        "Thank you for the great service! Just wanted to update my email address.",
        "URGENT: I think my account has been hacked. Unauthorized transactions detected!"
    ]

    print("=== Customer Support Ticket Processor ===\n")

    for i, ticket in enumerate(test_tickets, 1):
        print(f"Ticket #{i}:")
        print(f"Message: {ticket}\n")
        result = processor.process_and_format(ticket)
        print(result)
        print("\n" + "="*50 + "\n")


if __name__ == "__main__":
    main()
