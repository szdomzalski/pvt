from django.shortcuts import render


def reaction_test(request):
	return render(request, 'webgui/reaction_test.html')

