#!/usr/bin/env python3
"""Espejo de getVisibleOptionLetters para fijar el contrato antes del recorte."""

from __future__ import annotations

LETTERS = ("a", "b", "c", "d", "e")


def get_visible_option_letters(options=None, subject=None):
    from_options = [
        letter
        for letter in LETTERS
        if isinstance((options or {}).get(letter), str)
        and (options or {}).get(letter).strip()
    ]
    if from_options:
        return from_options
    if subject in {"M1", "M2"}:
        return ["a", "b", "c", "d"]
    return ["a", "b", "c", "d", "e"]


def test_m1_image_question_does_not_invent_e():
    letters = get_visible_option_letters(
        options={"a": "(2a-2)", "b": "(a-2)", "c": "(a^2-a-2)", "d": "(2a-2)"},
        subject="M1",
    )
    assert letters == ["a", "b", "c", "d"], letters


def test_language_keeps_five_options():
    letters = get_visible_option_letters(
        options={"a": "1", "b": "2", "c": "3", "d": "4", "e": "5"},
        subject="L",
    )
    assert letters == ["a", "b", "c", "d", "e"]


def test_m1_without_option_text_defaults_to_four():
    letters = get_visible_option_letters(options={}, subject="M1")
    assert letters == ["a", "b", "c", "d"]


if __name__ == "__main__":
    test_m1_image_question_does_not_invent_e()
    test_language_keeps_five_options()
    test_m1_without_option_text_defaults_to_four()
    print("option letters ok")
