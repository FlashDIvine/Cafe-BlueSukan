import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { getTableFromUrl } from '../utils/formatters';
import { MOCK_MENUS, CATEGORIES } from '../data/mockMenus';
import { fetchMenusApi } from '../services/api';

export const OrderContext = createContext(null);

export const OrderProvider = ({ children }) => {
  // Menu items state (initialized with mock data, fetches from backend)
  const [menus, setMenus] = useState(MOCK_MENUS);
  const [categories, setCategories] = useState(CATEGORIES);

  // Fetch menus from backend API on mount & poll every 3s for realtime stock/menu updates
  useEffect(() => {
    const fetchLatestMenus = () => {
      if (typeof document !== 'undefined' && document.hidden) return;

      fetchMenusApi()
        .then((res) => {
          if (res?.data?.length) {
            setMenus((prev) => {
              if (prev.length === res.data.length) {
                const isIdentical = prev.every((pItem, idx) => {
                  const nItem = res.data[idx];
                  return (
                    pItem.id === nItem.id &&
                    pItem.stock === nItem.stock &&
                    pItem.is_available === nItem.is_available &&
                    pItem.price === nItem.price &&
                    pItem.name === nItem.name &&
                    pItem.category_id === nItem.category_id &&
                    pItem.is_popular === nItem.is_popular &&
                    pItem.image_url === nItem.image_url
                  );
                });
                if (isIdentical) return prev;
              }
              return res.data;
            });
          }
          if (res?.categories?.length) {
            setCategories((prev) => {
              if (prev.length === res.categories.length) {
                const isIdentical = prev.every((pCat, idx) => {
                  const nCat = res.categories[idx];
                  return pCat.id === nCat.id && pCat.name === nCat.name && pCat.image === nCat.image;
                });
                if (isIdentical) return prev;
              }
              return res.categories;
            });
          }
        })
        .catch(() => {
          // Backend unavailable — keep using existing state
        });
    };

    fetchLatestMenus();
    const interval = setInterval(fetchLatestMenus, 3000);

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchLatestMenus();
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, []);

  // Customer & Table state
  const [tableNumber, setTableNumber] = useState(() => getTableFromUrl('04'));
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');

  // Cart state: Array of { menuId, name, price, quantity, maxStock, imageUrl, subtotal }
  const [cartItems, setCartItems] = useState([]);

  // Toast / notification feedback state (for stock warnings, add confirmations)
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((msg, type = 'info') => {
    setToastMessage({ msg, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage((prev) => (prev && prev.msg === msg ? null : prev));
    }, 3000);
  }, []);

  // Listen to URL search param changes on initial load or popstate
  useEffect(() => {
    const handleUrlChange = () => {
      const urlTable = getTableFromUrl(tableNumber || '04');
      setTableNumber(urlTable);
    };
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [tableNumber]);

  /**
   * Add item to cart or increment quantity
   * @param {Object} menuItem
   * @param {number} qtyToAdd
   */
  const addToCart = useCallback((menuItem, qtyToAdd = 1) => {
    if (!menuItem || menuItem.stock <= 0 || !menuItem.is_available) {
      showToast(`Maaf, "${menuItem?.name || 'Menu'}" sedang habis.`, 'warning');
      return false;
    }

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.menuId === menuItem.id);

      if (existingIndex > -1) {
        const existingItem = prevItems[existingIndex];
        const updatedQty = existingItem.quantity + qtyToAdd;

        if (updatedQty > menuItem.stock) {
          showToast(`Maksimal pesanan "${menuItem.name}" adalah ${menuItem.stock} porsi (sisa stok).`, 'warning');
          return prevItems;
        }

        const updated = [...prevItems];
        updated[existingIndex] = {
          ...existingItem,
          quantity: updatedQty,
          subtotal: updatedQty * existingItem.price,
        };
        showToast(`"${menuItem.name}" ditambahkan ke keranjang`, 'success');
        return updated;
      } else {
        if (qtyToAdd > menuItem.stock) {
          showToast(`Maksimal pesanan "${menuItem.name}" adalah ${menuItem.stock} porsi.`, 'warning');
          return prevItems;
        }

        showToast(`"${menuItem.name}" ditambahkan ke keranjang`, 'success');
        return [
          ...prevItems,
          {
            menuId: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: qtyToAdd,
            maxStock: menuItem.stock,
            imageUrl: menuItem.image_url,
            subtotal: qtyToAdd * menuItem.price,
          },
        ];
      }
    });
    return true;
  }, [showToast]);

  /**
   * Update quantity of a menu item in cart
   * @param {number} menuId
   * @param {number} newQty
   */
  const updateQty = useCallback((menuId, newQty) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.menuId === menuId);
      if (!existing) return prevItems;

      if (newQty <= 0) {
        return prevItems.filter((item) => item.menuId !== menuId);
      }

      if (newQty > existing.maxStock) {
        showToast(`Maksimal kuantitas adalah sisa stok (${existing.maxStock}).`, 'warning');
        return prevItems;
      }

      return prevItems.map((item) => {
        if (item.menuId === menuId) {
          return {
            ...item,
            quantity: newQty,
            subtotal: newQty * item.price,
          };
        }
        return item;
      });
    });
  }, [showToast]);

  /**
   * Remove a menu item completely from cart
   * @param {number} menuId
   */
  const removeFromCart = useCallback((menuId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.menuId !== menuId));
  }, []);

  /**
   * Clear all items in cart
   */
  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  /**
   * Get quantity of a menu item currently in cart
   * @param {number} menuId
   * @returns {number}
   */
  const getItemQtyInCart = useCallback((menuId) => {
    const found = cartItems.find((item) => item.menuId === menuId);
    return found ? found.quantity : 0;
  }, [cartItems]);

  // Derived totals
  const totalItemsCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  const grandTotalPrice = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  }, [cartItems]);

  const value = {
    // Menu & Categories
    menus,
    setMenus,
    categories,
    setCategories,
    // Table & Customer info
    tableNumber,
    setTableNumber,
    customerName,
    setCustomerName,
    notes,
    setNotes,
    // Cart operations
    cartItems,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    getItemQtyInCart,
    // Totals
    totalItemsCount,
    grandTotalPrice,
    // Feedback
    toastMessage,
    showToast,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};
