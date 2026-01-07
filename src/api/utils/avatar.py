"""
Avatar Auto-Generation Utilities.

Generates avatar URLs for users based on their initials or email hash.
Uses external avatar services for generating profile pictures.
"""
import hashlib
from typing import Optional
from urllib.parse import quote


def generate_avatar_url(
    email: str,
    display_name: Optional[str] = None,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    size: int = 128,
    style: str = "initials"
) -> str:
    """
    Generate an avatar URL for a user.
    
    Uses UI Avatars service for initials-based avatars or
    DiceBear for more stylized avatars.
    
    Args:
        email: User's email (used for hash-based generation)
        display_name: Optional display name for initials
        first_name: Optional first name for initials
        last_name: Optional last name for initials
        size: Avatar size in pixels (default 128)
        style: Avatar style - "initials", "shapes", "thumbs", "avataaars"
        
    Returns:
        Avatar URL string
    """
    if style == "initials":
        return _generate_ui_avatar(
            display_name=display_name,
            first_name=first_name,
            last_name=last_name,
            email=email,
            size=size
        )
    else:
        return _generate_dicebear_avatar(email, size, style)


def _generate_ui_avatar(
    display_name: Optional[str],
    first_name: Optional[str],
    last_name: Optional[str],
    email: str,
    size: int
) -> str:
    """
    Generate avatar using UI Avatars service.
    
    Creates a clean, professional avatar with user's initials.
    https://ui-avatars.com/
    """
    # Determine the name to use for initials
    if display_name:
        name = display_name
    elif first_name and last_name:
        name = f"{first_name} {last_name}"
    elif first_name:
        name = first_name
    else:
        # Use email prefix
        name = email.split("@")[0]
    
    # Generate consistent background color from email hash
    email_hash = hashlib.md5(email.lower().encode()).hexdigest()
    background_color = email_hash[:6]
    
    # Determine text color (light or dark) based on background
    text_color = _get_contrast_color(background_color)
    
    # URL encode the name
    encoded_name = quote(name)
    
    return (
        f"https://ui-avatars.com/api/"
        f"?name={encoded_name}"
        f"&size={size}"
        f"&background={background_color}"
        f"&color={text_color}"
        f"&bold=true"
        f"&format=svg"
    )


def _generate_dicebear_avatar(email: str, size: int, style: str) -> str:
    """
    Generate avatar using DiceBear service.
    
    Creates stylized avatars based on email hash.
    https://www.dicebear.com/
    """
    # Generate seed from email
    seed = hashlib.md5(email.lower().encode()).hexdigest()
    
    # Map style names to DiceBear styles
    style_map = {
        "shapes": "shapes",
        "thumbs": "thumbs",
        "avataaars": "avataaars",
        "bottts": "bottts",
        "identicon": "identicon"
    }
    
    dicebear_style = style_map.get(style, "shapes")
    
    return f"https://api.dicebear.com/7.x/{dicebear_style}/svg?seed={seed}&size={size}"


def _get_contrast_color(hex_color: str) -> str:
    """
    Determine whether to use light or dark text based on background color.
    
    Args:
        hex_color: 6-character hex color code (without #)
        
    Returns:
        "ffffff" for dark backgrounds, "333333" for light backgrounds
    """
    # Convert hex to RGB
    r = int(hex_color[0:2], 16)
    g = int(hex_color[2:4], 16)
    b = int(hex_color[4:6], 16)
    
    # Calculate luminance
    luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    
    # Use white text for dark backgrounds, dark text for light backgrounds
    return "ffffff" if luminance < 0.5 else "333333"
