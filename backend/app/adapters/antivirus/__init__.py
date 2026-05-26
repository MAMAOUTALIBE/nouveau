"""Adapter antivirus — client ClamAV minimal (protocole INSTREAM).

Exposé en propre pour rester découplé du module ``core/security`` : la
décision « scanner ou pas » est métier (config), l'implémentation socket
reste un adapter externe.
"""
