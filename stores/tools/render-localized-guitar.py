"""Compatibility entry point for the published guitar listing instructions."""
import sys
from localized_visuals import render

if __name__ == '__main__':
    render('guitar', sys.argv[1], '--banner' in sys.argv[2:])
