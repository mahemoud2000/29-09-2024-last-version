//  // إعدادات Firebase
//  const firebaseConfig = {
//     apiKey: "AIzaSyCPpTAJDRfFuDkq2TGCVIU_LnmYRBXTnSc",
//     authDomain: "new-protfolio.firebaseapp.com",
//     databaseURL: "https://new-protfolio-default-rtdb.firebaseio.com",
//     projectId: "new-protfolio",
//     storageBucket: "new-protfolio.appspot.com",
//     messagingSenderId: "90141039664",
//     appId: "1:90141039664:web:44d13d2f3b943f510aa1f5"
// };

// تهيئة Firebase
// firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const productsRef = database.ref('products');

// دالة لإضافة المنتج إلى قاعدة البيانات
window.addProduct = function addProduct() {
    document.getElementById('successMessage').style.display = 'none';
    document.getElementById('loader').style.display = 'block';

    const productName = document.getElementById('productName').value;
    const productPrice = document.getElementById('productPrice').value;
    const productQuantity = document.getElementById('productQuantity').value;

    if (productName === "" || productPrice === "" || productQuantity === "") {
        alert("من فضلك أدخل جميع البيانات.");
        document.getElementById('loader').style.display = 'none';
        return;
    }

    const today = new Date();
    const dateKey = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

    productsRef.once('value').then((snapshot) => {
        let nextId = 1;
        snapshot.forEach(childSnapshot => {
            const childId = childSnapshot.key;
            if (childId.startsWith(dateKey)) {
                const numericId = parseInt(childId.slice(-3));
                if (numericId >= nextId) {
                    nextId = numericId + 1;
                }
            }
        });

        const productId = `${dateKey}${String(nextId).padStart(3, '0')}`; // ID بالتنسيق المطلوب

        productsRef.child(productId).set({
            name: productName,
            price: productPrice,
            quantity: productQuantity,
            timestamp: new Date().toISOString()
        }, function(error) {
            document.getElementById('loader').style.display = 'none';

            if (error) {
                alert("حدث خطأ أثناء إضافة المنتج.");
            } else {
                document.getElementById('successMessage').style.display = 'block';
                document.getElementById('productName').value = "";
                document.getElementById('productPrice').value = "";
                document.getElementById('productQuantity').value = "";
            }
        });
    });
}

// دالة لتحميل المنتجات وعرضها
window.loadProducts = function loadProducts() {
    const productsListDiv = document.getElementById('productsList');
    productsListDiv.innerHTML = "";
    document.getElementById('loader').style.display = 'block';

    productsRef.once('value', (snapshot) => {
        document.getElementById('loader').style.display = 'none';

        snapshot.forEach(childSnapshot => {
            const product = childSnapshot.val();
            const productId = childSnapshot.key;

            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            productItem.innerHTML = `
                <h3>${product.name} (ID: ${productId})</h3>
                <p>السعر: ${product.price}</p>
                <p>الكمية: ${product.quantity}</p>
                <p>تاريخ الإضافة: ${new Date(product.timestamp).toLocaleString()}</p>
                <button onclick="editProduct('${productId}')">تعديل</button>
                <button onclick="deleteProduct('${productId}')">حذف</button>
            `;
            productsListDiv.appendChild(productItem);
        });
    });
}

// دالة لتصفية المنتجات بناءً على إدخال البحث
window.filterProducts = function filterProducts() {
    const searchValue = document.getElementById('searchInput').value.toLowerCase();
    const productsListDiv = document.getElementById('productsList');
    const productItems = productsListDiv.getElementsByClassName('product-item');

    Array.from(productItems).forEach(item => {
        const productName = item.getElementsByTagName('h3')[0].innerText.toLowerCase();
        const productId = item.getElementsByTagName('h3')[0].innerText.split('(ID: ')[1].split(')')[0]; // استخراج ID

        if (productName.includes(searchValue) || productId.includes(searchValue)) {
            item.style.display = ""; // عرض المنتج
        } else {
            item.style.display = "none"; // إخفاء المنتج
        }
    });
}

// دالة لتعديل المنتج
window.editProduct = function editProduct(productId) {
    const productRef = productsRef.child(productId);

    productRef.once('value').then((snapshot) => {
        if (snapshot.exists()) {
            const productData = snapshot.val();

            document.getElementById('productName').value = productData.name;
            document.getElementById('productPrice').value = productData.price;
            document.getElementById('productQuantity').value = productData.quantity;

            const addButton = document.querySelector('button[onclick="addProduct()"]');
            addButton.onclick = function() {
                updateProduct(productId);
            };
        } else {
            alert("المنتج غير موجود.");
        }
    });
}

// دالة لتحديث المنتج
window.updateProduct = function updateProduct(productId) {
    const productName = document.getElementById('productName').value;
    const productPrice = document.getElementById('productPrice').value;
    const productQuantity = document.getElementById('productQuantity').value;

    if (productName === "" || productPrice === "" || productQuantity === "") {
        alert("من فضلك أدخل جميع البيانات.");
        return;
    }

    productsRef.child(productId).update({
        name: productName,
        price: productPrice,
        quantity: productQuantity,
        timestamp: new Date().toISOString()
    }, function(error) {
        if (error) {
            alert("حدث خطأ أثناء تحديث المنتج.");
        } else {
            alert("تم تحديث المنتج بنجاح.");
            document.getElementById('productName').value = "";
            document.getElementById('productPrice').value = "";
            document.getElementById('productQuantity').value = "";

            const addButton = document.querySelector('button[onclick="addProduct()"]');
            addButton.onclick = addProduct;

            loadProducts();
        }
    });
}

// دالة لحذف المنتج
window.deleteProduct = function deleteProduct(productId) {
    if (confirm("هل أنت متأكد أنك تريد حذف هذا المنتج؟")) {
        productsRef.child(productId).remove()
            .then(() => {
                alert("تم حذف المنتج بنجاح.");
                loadProducts();
            })
            .catch((error) => {
                alert("حدث خطأ أثناء حذف المنتج.");
            });
    }
}

// دالة لتبديل عرض جميع المنتجات
window.toggleProducts = function toggleProducts() {
    const productsListDiv = document.getElementById('productsList');
    const searchInput = document.getElementById('searchInput');

    if (productsListDiv.style.display === "none") {
        loadProducts();
        productsListDiv.style.display = "block";
        searchInput.style.display = "block";
        document.getElementById('toggleButton').innerText = "إخفاء المنتجات";
    } else {
        productsListDiv.style.display = "none";
        searchInput.style.display = "none";
        document.getElementById('toggleButton').innerText = "عرض جميع المنتجات";
    }
}