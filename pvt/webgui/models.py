from django.db import models

class TestSession(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    duration = models.DurationField()

class Attempt(models.Model):
    class AttemptResult(models.IntegerChoices):
        VALID = 1
        TOO_EARLY = 2
        TOO_SLOW = 3
        NO_RESPONSE = 4

    test_session = models.ForeignKey(TestSession, on_delete=models.CASCADE)
    timestamp = models.DateTimeField()
    reaction_time = models.IntegerField()
    attempt_result = models.IntegerField(choices=AttemptResult.choices)


class TestResult(models.Model):
    test_session = models.OneToOneField(TestSession, on_delete=models.CASCADE)
    harmonic_mean = models.IntegerField()
    attempt_count = models.IntegerField()
    valid_count = models.IntegerField()
